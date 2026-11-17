import mongoose, { Schema } from 'mongoose';

const paymentSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    packId: {
      // QCoin top-up packs, or 'resume_pass' for a single
      // watermark-free PDF download.
      type: String,
      required: true,
    },
    coins: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Amount in rupees (order amount stored in paise by Razorpay)
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    razorpayOrderId: {
      type: String,
      required: true,
    },
    razorpayPaymentId: {
      type: String,
      default: null,
    },
    razorpaySignature: {
      type: String,
      default: null,
    },
    method: {
      type: String, // upi | card | netbanking | wallet ...
      default: null,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
    failureReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One order = one payment doc; webhook + checkout verify both claim it
// atomically via this unique key, so a payment can never be credited twice.
paymentSchema.index({ razorpayOrderId: 1 }, { unique: true });
paymentSchema.index({ userId: 1, createdAt: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
