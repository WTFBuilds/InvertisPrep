import mongoose, { Schema } from 'mongoose';

// Read-only view of the main server's `roles` collection. The PDF service and
// the main server share one MongoDB, so custom-role permissions are resolved
// straight from here instead of over HTTP — that removes the dependency on
// MAIN_SERVER_URL / INTERNAL_SERVICE_TOKEN being reachable for paper access.
// Written only by the main server (role CRUD lives there).
const roleSchema = new Schema(
  {
    name: { type: String, trim: true, lowercase: true },
    label: { type: String, trim: true },
    description: { type: String, trim: true, default: '' },
    color: { type: String, default: 'indigo' },
    permissions: { type: [String], default: [] },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Role = mongoose.model('Role', roleSchema, 'roles');
