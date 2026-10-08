import mongoose from 'mongoose';
import { Role } from '../models/Role.js';
import { User } from '../models/User.js';
import {
  GRANTABLE_PERMISSION_KEYS,
  ROLE_COLORS,
  invalidateRoleCache,
} from '../shared/permissions.js';

const SLUG_REGEX = /^[a-z0-9][a-z0-9-]{1,39}$/;

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
  memberCount: memberCount ?? 0,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
});

// GET /api/admin/roles — all roles with live member counts
export const listRoles = async (_req, res) => {
  try {
    const roles = await Role.find().sort({ createdAt: 1 }).lean();

    const counts = await User.aggregate([
      { $match: { roleId: { $ne: null } } },
      { $group: { _id: '$roleId', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id.toString(), c.count]));

    res.json({
      success: true,
      data: roles.map((role) => formatRole(role, countMap.get(role._id.toString()) || 0)),
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

// PATCH /api/admin/roles/:id — edit a custom role's label, color or permissions
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

    if (role.isSystem) {
      res.status(400).json({ success: false, message: 'Built-in roles cannot be edited' });
      return;
    }

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
    invalidateRoleCache(role._id);

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
