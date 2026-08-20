import { WatermarkJob } from '../models/WatermarkJob.js';
import { addWatermarkJob, getJobStatus } from '../services/queueService.js';
import { createJobSchema, jobIdSchema } from '../middleware/validation.js';
import { validate } from '../middleware/validation.js';

export const createJob = [
  validate(createJobSchema),
  async (req, res) => {
    try {
      const { paperId, userId, type } = req.body;

      // Verify the requesting service is authorized (internal service token)
      const serviceToken = req.headers['x-service-token'];
      if (serviceToken !== process.env.INTERNAL_SERVICE_TOKEN) {
        return res.status(403).json({ success: false, message: 'Unauthorized service' });
      }

      const job = await addWatermarkJob(paperId, userId, type);

      res.status(201).json({
        success: true,
        data: {
          jobId: job._id,
          status: job.status,
        },
      });
    } catch (err) {
      console.error('Create job error:', err);
      res.status(500).json({ success: false, message: 'Error creating job' });
    }
  },
];

export const getJob = [
  validate(jobIdSchema),
  async (req, res) => {
    try {
      const { id } = req.params;

      const job = await getJobStatus(id);
      if (!job) {
        return res.status(404).json({ success: false, message: 'Job not found' });
      }

      // Return minimal info based on status
      const response = {
        success: true,
        data: {
          jobId: job._id,
          status: job.status,
          type: job.type,
          paperId: job.paperId,
          userId: job.userId,
          createdAt: job.createdAt,
          startedAt: job.startedAt,
          completedAt: job.completedAt,
        },
      };

      if (job.status === 'completed' && job.result) {
        response.data.result = job.result;
      }

      if (job.status === 'failed' && job.error) {
        response.data.error = job.error;
      }

      res.json(response);
    } catch (err) {
      console.error('Get job error:', err);
      res.status(500).json({ success: false, message: 'Error fetching job' });
    }
  },
];

export const listJobs = async (req, res) => {
  try {
    const { page = '1', limit = '20', status, userId } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (pageNum - 1) * pageSize;

    const [total, jobs] = await Promise.all([
      WatermarkJob.countDocuments(filter),
      WatermarkJob.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      success: true,
      count: jobs.length,
      total,
      page: pageNum,
      pageSize,
      data: jobs,
    });
  } catch (err) {
    console.error('List jobs error:', err);
    res.status(500).json({ success: false, message: 'Error listing jobs' });
  }
};