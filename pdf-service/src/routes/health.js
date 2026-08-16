import { Router } from 'express';
import mongoose from 'mongoose';
import { getQueue } from '../services/queueService.js';

const router = Router();

router.get('/', (_req, res) => {
  const queue = getQueue();
  const dbState = mongoose.connection.readyState;
  const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

  res.json({
    success: true,
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: states[dbState] || 'unknown',
    queue: queue ? 'initialized' : 'disabled',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

export default router;