import axios from 'axios';

// Create axios instance for PDF service communication
const pdfService = axios.create({
  baseURL: process.env.PDF_SERVICE_URL || 'http://localhost:5002',
  timeout: 30000,
});

// Internal service-to-service auth
pdfService.interceptors.request.use(config => {
  config.headers['X-Service-Token'] = process.env.INTERNAL_SERVICE_TOKEN;
  return config;
});

/**
 * Enqueue a watermark job on the PDF service
 * @param {string} paperId - The PDF document ID
 * @param {string} userId - The user ID requesting the watermark
 * @param {'view'|'download'} type - Type of operation
 * @returns {Promise<{jobId: string, status: string}>}
 */
export const enqueueWatermarkJob = async (paperId, userId, type = 'view') => {
  try {
    const { data } = await pdfService.post('/api/jobs', { paperId, userId, type });
    return data.data; // { jobId, status }
  } catch (error) {
    console.error('[PDF Service] Failed to enqueue job:', error.message);
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'PDF service error');
    }
    throw error;
  }
};

/**
 * Get job status from PDF service
 * @param {string} jobId - The job ID
 * @returns {Promise<Object>} Job status and result
 */
export const getJobStatus = async (jobId) => {
  try {
    const { data } = await pdfService.get(`/api/jobs/${jobId}`);
    return data.data;
  } catch (error) {
    console.error('[PDF Service] Failed to get job status:', error.message);
    if (error.response?.data) {
      throw new Error(error.response.data.message || 'PDF service error');
    }
    throw error;
  }
};

/**
 * Check if PDF service is healthy
 * @returns {Promise<boolean>}
 */
export const checkPdfServiceHealth = async () => {
  try {
    const { data } = await pdfService.get('/api/health');
    return data.success && data.status === 'ok';
  } catch {
    return false;
  }
};

export default { enqueueWatermarkJob, getJobStatus, checkPdfServiceHealth };