import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  subject: {
    type: String,
    enum: ['cs', 'java', 'frontend', 'dsa'],
    required: true,
    index: true,
  },
  question: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [String],
    validate: {
      validator: (v) => v.length === 4,
      message: 'Must have exactly 4 options',
    },
    required: true,
  },
  correctIndex: {
    type: Number,
    min: 0,
    max: 3,
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    index: true,
  },
  explanation: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  timestamps: true,
});

questionSchema.index({ subject: 1, difficulty: 1 });

export default mongoose.model('Question', questionSchema);