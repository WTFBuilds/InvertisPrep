import mongoose, { Schema } from 'mongoose';

const transactionSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    category: {
      type: String,
      enum: ['topup', 'resume_download', 'bonus', 'refund'],
      required: true,
    },
    coins: {
      type: Number,
      required: true,
      min: 0,
    },
    // rupees is only set for topup transactions
    rupees: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    // resumeId is set when category is resume_download
    resumeId: {
      type: Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    // balanceAfter snapshot so history makes sense even if balance changes
    balanceAfter: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Fast user history queries
transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
