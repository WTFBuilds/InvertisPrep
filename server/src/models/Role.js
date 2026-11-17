import mongoose, { Schema } from 'mongoose';
import { GRANTABLE_PERMISSION_KEYS, ROLE_COLORS } from '../shared/permissions.js';

const roleSchema = new Schema(
  {
    // URL-safe unique slug, e.g. "content-team"
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9][a-z0-9-]{1,39}$/,
    },
    // Human display name, e.g. "Content Team"
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    // One of the shared color keys — drives badge/dot styling in the UI
    color: {
      type: String,
      enum: ROLE_COLORS,
      default: 'indigo',
    },
    permissions: [
      {
        type: String,
        enum: GRANTABLE_PERMISSION_KEYS,
      },
    ],
    // System roles are the built-ins; they are hardcoded, never editable
    isSystem: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Role = mongoose.model('Role', roleSchema);
