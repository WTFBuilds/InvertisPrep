import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema(
  {
    googleId: {
      type: String,
      sparse: true,
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      select: false,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    picture: {
      type: String,
    },
    studentId: {
      type: String,
      trim: true,
      default: '',
    },
    phoneNumber: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      trim: true,
      default: '',
    },
    followers: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    following: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      }
    ],
    role: {
      type: String,
      enum: ['student', 'srt', 'admin', 'super-admin'],
      default: 'student',
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    qcoins: {
      type: Number,
      default: 0,
      min: 0,
    },
    freeDownloadsLeft: {
      type: Number,
      default: 2,
      min: 0,
    },
    points: {
      type: Number,
      default: 0,
      min: 0,
      index: true,
    },
    weeklyPoints: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ role: 1, isActive: 1 });

export const User = mongoose.model('User', userSchema);
