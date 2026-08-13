import mongoose, { Schema } from 'mongoose';

const sponsorSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    batch: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    message: {
      type: String,
      trim: true,
      default: '',
    },
    tier: {
      type: String,
      enum: ['supporter', 'benefactor', 'patron'],
      default: 'supporter',
    },
    amount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
sponsorSchema.index({ isActive: 1, isFeatured: 1, createdAt: -1 });

export const Sponsor = mongoose.model('Sponsor', sponsorSchema);
