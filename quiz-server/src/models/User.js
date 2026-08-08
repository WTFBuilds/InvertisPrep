import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  googleId: {
    type: String,
    unique: true,
    sparse: true,
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
    default: '',
  },
  phoneNumber: {
    type: String,
    default: '',
  },
  course: {
    type: String,
    default: '',
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  role: {
    type: String,
    enum: ['student', 'admin', 'super-admin'],
    default: 'student',
  },
  lastLogin: {
    type: Date,
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
}, {
  timestamps: true,
});

export const User = mongoose.model('User', userSchema);
export default User;