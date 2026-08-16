import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import { PDFDocument } from '../models/PDFDocument.js';
import { WatermarkJob } from '../models/WatermarkJob.js';
import { buildWatermarkedPdf, buildDownloadFilename } from './pdfProcessor.js';
import { cloudinaryAxios } from './cloudinaryService.js';
import cloudinary from '../config/cloudinary.js';
import { env } from '../config/env.js';

let redis = null;
let watermarkQueue = null;
let queueEvents = null;
let queueDisabled = false;

export const initializeQueue = () => {
  if (!env.REDIS_URL) {
    console.warn('[Queue] REDIS_URL not set, queue disabled - jobs will be processed synchronously');
    queueDisabled = true;
    return null;
  }

  try {
    // Use maxRetriesPerRequest: null for BullMQ compatibility
    redis = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      retryStrategy: (times) => {
        if (times > 3) {
          console.warn('[Queue] Redis connection failed after 3 retries, disabling queue');
          queueDisabled = true;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 3000);
      },
      enableReadyCheck: true,
      lazyConnect: true,
      connectTimeout: 5000,
    });

    redis.on('error', (err) => {
      if (!queueDisabled) {
        console.error('[Queue] Redis error:', err.message);
      }
    });

    redis.on('connect', () => {
      console.log('[Queue] Redis connected');
    });

    // Test connection
    redis.connect().catch((err) => {
      console.warn('[Queue] Redis connection failed:', err.message);
      queueDisabled = true;
    });

    watermarkQueue = new Queue('watermark', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
      },
    });

    queueEvents = new QueueEvents('watermark', { connection: redis });

    queueEvents.on('completed', ({ jobId, returnvalue }) => {
      console.log(`[Queue] Job ${jobId} completed`);
    });

    queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.error(`[Queue] Job ${jobId} failed:`, failedReason);
    });

    return watermarkQueue;
  } catch (error) {
    console.error('[Queue] Failed to initialize:', error.message);
    queueDisabled = true;
    return null;
  }
};

export const getQueue = () => watermarkQueue;

export const isQueueDisabled = () => queueDisabled;

export const closeQueue = async () => {
  if (watermarkQueue) {
    await watermarkQueue.close();
  }
  if (queueEvents) {
    await queueEvents.close();
  }
  if (redis) {
    await redis.quit();
  }
};

export const addWatermarkJob = async (paperId, userId, type = 'view') => {
  // Check for existing pending/processing job (dedupe)
  const existingJob = await WatermarkJob.findOne({
    paperId,
    userId,
    type,
    status: { $in: ['pending', 'processing'] },
  }).sort({ createdAt: -1 });

  if (existingJob) {
    console.log(`[Queue] Reusing existing job ${existingJob._id} for ${paperId}:${userId}:${type}`);
    return existingJob;
  }

  // Create job record
  const job = await WatermarkJob.create({
    paperId,
    userId,
    type,
    status: 'pending',
  });

  if (queueDisabled || !watermarkQueue) {
    // Process synchronously
    console.log(`[Queue] Processing job ${job._id} synchronously (queue disabled)`);
    job.status = 'processing';
    job.startedAt = new Date();
    await job.save();
    
    try {
      const result = await processWatermarkJob({
        jobId: job._id.toString(),
        paperId,
        userId,
        type,
      });
      return job;
    } catch (error) {
      throw error;
    }
  }

  // Add to BullMQ queue
  const bullJob = await watermarkQueue.add('watermark', {
    jobId: job._id.toString(),
    paperId,
    userId,
    type,
  }, {
    jobId: job._id.toString(),
  });

  job.bullJobId = bullJob.id;
  job.status = 'processing';
  job.startedAt = new Date();
  await job.save();

  console.log(`[Queue] Added watermark job ${job._id} (BullMQ: ${bullJob.id})`);
  return job;
};

export const getJobStatus = async (jobId) => {
  return WatermarkJob.findById(jobId);
};

export const processWatermarkJob = async (jobData) => {
  const { jobId, paperId, userId, type } = jobData;

  const job = await WatermarkJob.findById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  try {
    // Fetch paper from main server's DB (shared MongoDB)
    const paper = await PDFDocument.findById(paperId);
    if (!paper) {
      throw new Error(`Paper ${paperId} not found`);
    }

    // Fetch user (minimal data for watermark)
    const user = { id: userId, email: `user-${userId}@invertisprep.in` };
    // TODO: Could fetch actual email from main server if needed

    job.status = 'processing';
    job.attempts += 1;
    await job.save();

    // Build watermarked PDF
    const watermarkedBytes = await buildWatermarkedPdf(paper, user);

    // Upload watermarked PDF to Cloudinary
    const result = await cloudinary.uploader.upload(
      `data:application/pdf;base64,${Buffer.from(watermarkedBytes).toString('base64')}`,
      {
        resource_type: 'raw',
        public_id: `watermarked/${paperId}/${userId}/${type}/${Date.now()}`,
      }
    );

    const fileName = type === 'download' ? buildDownloadFilename(paper) : 'paper.pdf';

    job.status = 'completed';
    job.completedAt = new Date();
    job.result = {
      watermarkedUrl: result.secure_url,
      fileName,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    };
    await job.save();

    return job.result;
  } catch (error) {
    job.attempts += 1;
    job.error = {
      message: error.message,
      stack: error.stack,
    };

    if (job.attempts >= job.maxAttempts) {
      job.status = 'failed';
      job.completedAt = new Date();
    } else {
      job.status = 'pending'; // Will be retried by BullMQ
    }

    await job.save();
    throw error;
  }
};

// Worker function - call this to start processing
export const startWorker = () => {
  if (!watermarkQueue) {
    console.warn('[Worker] Cannot start worker - queue not initialized (REDIS_URL missing)');
    return null;
  }

  const worker = new Worker('watermark', async (job) => {
    return processWatermarkJob(job.data);
  }, {
    connection: redis,
    concurrency: 2, // Limit concurrent PDF renders
  });

  worker.on('completed', (job) => {
    console.log(`[Worker] Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`[Worker] Job ${job?.id} failed:`, err);
  });

  worker.on('error', (err) => {
    console.error('[Worker] Error:', err);
  });

  console.log('[Worker] Watermark worker started with concurrency 2');
  return worker;
};