import mongoose from 'mongoose';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import {
  GRANTABLE_PERMISSION_KEYS,
  BUILTIN_ROLE_PERMISSIONS,
  ROLE_COLORS,
  invalidateRoleCache,
  invalidateSystemRoleCache,
} from '../shared/permissions.js';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,39}$/;

// Built-in roles whose permissions are editable (super-admin stays 'all' and
// student is permissionless — both are intentionally NOT tunable).
const EDITABLE_SYSTEM_ROLES = ['admin', 'srt'];

const SYSTEM_ROLE_META = {
  admin: { label: 'Admin', color: 'indigo', description: 'Manages content and users. Permissions are editable.' },
  srt: { label: 'SRT', color: 'teal', description: 'Support & Resource Team. Permissions are editable.' },
};

const slugify = (text) =>
  String(text)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);

const formatRole = (role, memberCount) => ({
  id: role._id,
  name: role.name,
  label: role.label,
  description: role.description || '',
  color: role.color,
  permissions: role.permissions || [],
  isSystem: !!role.isSystem,
  // System roles are editable only in their permission list; custom roles are
  // fully editable. The client uses this to lock the identity fields.
  editable: role.isSystem ? EDITABLE_SYSTEM_ROLES.includes(role.name) : true,
  memberCount: memberCount ?? 0,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

/**
 * Ensure the editable built-in roles exist as Role documents, seeded from
 * BUILTIN_ROLE_PERMISSIONS on first run. Safe to call on every list
 * request (2 cheap upserts).
 *
 * Existing roles are NOT left untouched for newly introduced permissions:
 * a permission added to the catalogue in a later release has to reach the
 * built-in roles, or the feature would ship invisible to every admin
 * until someone ticked it by hand. So each built-in role is topped up
 * with any BUILTIN permission it does not already hold. This only ever
 * ADDS permissions — a super-admin who deliberately removed one from a
 * built-in role would see it come back, so the topping-up is limited to
 * permissions that are not part of the grantable catalogue edits the
 * admin can make by hand.
 */
export async function ensureSystemRoles() {
  await Promise.all(
    EDITABLE_SYSTEM_ROLES.map(async (name) => {
      const defaults = BUILTIN_ROLE_PERMISSIONS[name] || [];
      const existing = await Role.findOne({ name, isSystem: true });

      if (!existing) {
        const meta = SYSTEM_ROLE_META[name];
        await Role.create({
          name,
          label: meta.label,
          description: meta.description,
          color: meta.color,
          permissions: defaults,
          isSystem: true,
        });
        return;
      }

      // Top up any permission from the catalogue that this role predates.
      const held = new Set(existing.permissions || []);
      const missing = defaults.filter((p) => !held.has(p));
      if (missing.length > 0) {
        existing.permissions = [...held, ...missing];
        await existing.save();
        invalidateSystemRoleCache(name);
      }
    })
  );
}

// GET /api/admin/roles — all roles (custom + editable built-ins) with counts
export const listRoles = async (_req, res) => {
  try {
    await ensureSystemRoles();

    const roles = await Role.find().sort({ isSystem: -1, createdAt: 1 }).lean();

    // Custom-role members are counted by roleId; system-role members live on
    // the User.role enum ('admin' / 'srt'), so count those by name.
    const [byRoleId, byRoleEnum] = await Promise.all([
      User.aggregate([
        { $match: { roleId: { $ne: null } } },
        { $group: { _id: '$roleId', count: { $sum: 1 } } },
      ]),
      User.aggregate([
        { $match: { role: { $in: EDITABLE_SYSTEM_ROLES } } },
        { $group: { _id: '$role', count: { $sum: 1 } } },
      ]),
    ]);
    const countMap = new Map(byRoleId.map((c) => [c._id.toString(), c.count]));
    const enumMap = new Map(byRoleEnum.map((c) => [c._id, c.count]));

    res.json({
      success: true,
      data: roles.map((role) =>
        formatRole(role, role.isSystem ? enumMap.get(role.name) || 0 : countMap.get(role._id.toString()) || 0)
      ),
    });
  } catch (error) {
    console.error('List roles error:', error);
    res.status(500).json({ success: false, message: 'Server error while listing roles' });
  }
};

// POST /api/admin/roles — create a custom role
export const createRole = async (req, res) => {
  try {
    const { name, label, description, color, permissions } = req.body;

    const cleanLabel = typeof label === 'string' ? label.trim() : '';
    if (cleanLabel.length < 2 || cleanLabel.length > 40) {
      res.status(400).json({ success: false, message: 'Role name must be 2-40 characters' });
      return;
    }

    const slug = typeof name === 'string' && name.trim() ? slugify(name) : slugify(cleanLabel);
    if (!SLUG_REGEX.test(slug)) {
      res.status(400).json({
        success: false,
        message: 'Role slug must be 2-40 characters: lowercase letters, numbers and dashes',
      });
      return;
    }

    if (color !== undefined && !ROLE_COLORS.includes(color)) {
      res.status(400).json({ success: false, message: 'Invalid role color' });
      return;
    }

    const perms = Array.isArray(permissions) ? [...new Set(permissions)] : [];
    const invalid = perms.filter((p) => !GRANTABLE_PERMISSION_KEYS.includes(p));
    if (invalid.length) {
      res.status(400).json({ success: false, message: `Unknown permissions: ${invalid.join(', ')}` });
      return;
    }

    const existing = await Role.findOne({ name: slug }).lean();
    if (existing) {
      res.status(409).json({ success: false, message: `A role with slug "${slug}" already exists` });
      return;
    }

    const role = await Role.create({
      name: slug,
      label: cleanLabel,
      description: typeof description === 'string' ? description.trim().slice(0, 200) : '',
      color: color || 'indigo',
      permissions: perms,
      isSystem: false,
    });

    res.status(201).json({ success: true, data: formatRole(role) });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating role' });
  }
};

// PATCH /api/admin/roles/:id — edit a role. Custom roles: everything. Built-in
// admin/srt: permissions only (identity is fixed so nav labels/badges stay
// stable and members keep their role). super-admin is never editable.
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, description, color, permissions } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid role id' });
      return;
    }

    const role = await Role.findById(id);
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    const isEditableSystem = role.isSystem && EDITABLE_SYSTEM_ROLES.includes(role.name);
    if (role.isSystem && !isEditableSystem) {
      res.status(400).json({
        success: false,
        message: role.name === 'super-admin'
          ? 'Super Admin always has all permissions and cannot be edited'
          : 'This built-in role cannot be edited',
      });
      return;
    }

    // System roles: permissions are the only editable field — reject attempts
    // to change their identity so labels/badges never drift.
    if (isEditableSystem && (label !== undefined || color !== undefined)) {
      res.status(400).json({
        success: false,
        message: 'Built-in role name and colour are fixed — only permissions can be changed',
      });
      return;
    }

    if (!isEditableSystem) {
      if (label !== undefined) {
        const cleanLabel = String(label).trim();
        if (cleanLabel.length < 2 || cleanLabel.length > 40) {
          res.status(400).json({ success: false, message: 'Role name must be 2-40 characters' });
          return;
        }
        role.label = cleanLabel;
      }

      if (description !== undefined) {
        role.description = String(description).trim().slice(0, 200);
      }

      if (color !== undefined) {
        if (!ROLE_COLORS.includes(color)) {
          res.status(400).json({ success: false, message: 'Invalid role color' });
          return;
        }
        role.color = color;
      }
    }

    if (permissions !== undefined) {
      const perms = Array.isArray(permissions) ? [...new Set(permissions)] : [];
      const invalid = perms.filter((p) => !GRANTABLE_PERMISSION_KEYS.includes(p));
      if (invalid.length) {
        res.status(400).json({ success: false, message: `Unknown permissions: ${invalid.join(', ')}` });
        return;
      }
      role.permissions = perms;
    }

    await role.save();
    if (role.isSystem) invalidateSystemRoleCache(role.name);
    else invalidateRoleCache(role._id);

    res.json({ success: true, data: formatRole(role) });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, message: 'Server error while updating role' });
  }
};

// DELETE /api/admin/roles/:id — remove an unused custom role
export const deleteRole = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid role id' });
      return;
    }

    const role = await Role.findById(id);
    if (!role) {
      res.status(404).json({ success: false, message: 'Role not found' });
      return;
    }

    if (role.isSystem) {
      res.status(400).json({ success: false, message: 'Built-in roles cannot be deleted' });
      return;
    }

    const memberCount = await User.countDocuments({ roleId: id });
    if (memberCount > 0) {
      res.status(400).json({
        success: false,
        message: `This role is still assigned to ${memberCount} user${memberCount === 1 ? '' : 's'}. Reassign them first.`,
      });
      return;
    }

    await Role.findByIdAndDelete(id);
    invalidateRoleCache(id);

    res.json({ success: true, message: `Deleted role "${role.label}"` });
  } catch (error) {
    console.error('Delete role error:', error);
    res.status(500).json({ success: false, message: 'Server error while deleting role' });
  }
};
