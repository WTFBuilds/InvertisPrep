import mongoose, { Schema } from 'mongoose';

const pointsLogSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['upload', 'contribution', 'quiz', 'community'],
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

pointsLogSchema.index({ createdAt: -1 });
pointsLogSchema.index({ userId: 1, createdAt: -1 });

export const PointsLog = mongoose.model('PointsLog', pointsLogSchema);
export default PointsLog;
