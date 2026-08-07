import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  chosenIndex: { type: Number, default: -1 }, // -1 = timeout
  isCorrect: { type: Boolean, default: false },
  timeTaken: { type: Number, default: 0 }, // ms
}, { _id: false });

const playerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  score: { type: Number, default: 0 },
  correctCount: { type: Number, default: 0 },
  answers: [answerSchema],
}, { _id: false });

const quizMatchSchema = new mongoose.Schema({
  players: [playerSchema],
  subject: {
    type: String,
    enum: ['cs', 'java', 'frontend', 'dsa'],
    required: true,
    index: true,
  },
  mode: {
    type: String,
    enum: ['auto', 'room'],
    required: true,
  },
  roomCode: {
    type: String,
    sparse: true,
    index: true,
  },
  status: {
    type: String,
    enum: ['waiting', 'countdown', 'playing', 'finished', 'cancelled'],
    default: 'waiting',
    index: true,
  },
  currentQuestion: { type: Number, default: 0 },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  startedAt: Date,
  finishedAt: Date,
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true,
});

quizMatchSchema.index({ status: 1, subject: 1 });
quizMatchSchema.index({ 'players.user': 1, createdAt: -1 });

export default mongoose.model('QuizMatch', quizMatchSchema);