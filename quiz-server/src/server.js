import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import connectDB from './config/database.js';
import { authenticateSocket } from './middleware/auth.js';
import { registerQuizHandlers } from './socket/index.js';
import quizRoutes from './routes/quiz.js';

// Import all models so Mongoose registers schemas for ref lookups
import './models/Question.js';
import './models/QuizMatch.js';

// Register User schema for ObjectId refs in QuizMatch
const userSchema = new mongoose.Schema({
  googleId: String,
  email: { type: String, unique: true },
  name: String,
  picture: String,
  role: { type: String, default: 'student' },
  qcoins: { type: Number, default: 0 },
}, { timestamps: true });
mongoose.model('User', userSchema);

const PORT = process.env.PORT || 5001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

async function initServer() {
  await connectDB();

  const app = express();
  const httpServer = createServer(app);

  // Socket.io
  const io = new Server(httpServer, {
    cors: {
      origin: [CLIENT_URL, 'http://localhost:3000'],
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 20000,
    pingInterval: 10000,
  });

  // Auth middleware for socket connections
  io.use(authenticateSocket);

  // Register socket event handlers
  registerQuizHandlers(io);

  // Middleware
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(cors({ origin: [CLIENT_URL, 'http://localhost:3000'], credentials: true }));
  app.use(morgan('dev'));
  app.use(express.json());

  // Routes
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', server: 'quiz-server', timestamp: new Date().toISOString() });
  });

  app.use('/api/quiz', quizRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Not found' });
  });

  // Error handler
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Server error' });
  });

  httpServer.listen(PORT, () => {
    console.log(`Quiz server running on port ${PORT}`);
  });
}

initServer();