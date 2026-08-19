import dotenv from 'dotenv';
dotenv.config();

import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(5002),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Database
  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // Cloudinary
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),
  
  // Redis (Upstash)
  REDIS_URL: z.string().url('REDIS_URL must be a valid Redis URL').optional(),
  
  // Internal Service Communication
  INTERNAL_SERVICE_TOKEN: z.string().min(32, 'INTERNAL_SERVICE_TOKEN must be at least 32 characters'),
  
  // PDF Service Config
  PDF_CACHE_MAX_MB: z.coerce.number().default(80),
  PDF_LRU_MAX_ENTRIES: z.coerce.number().default(40),
  
  // Main Server URL (for user fallback)
  MAIN_SERVER_URL: z.string().url().default('http://localhost:5000'),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000), // 15 minutes
  RATE_LIMIT_MAX: z.coerce.number().default(1000),
  PDF_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(1 * 60 * 1000), // 1 minute
  PDF_RATE_LIMIT_MAX: z.coerce.number().default(120),
  READ_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  READ_RATE_LIMIT_MAX: z.coerce.number().default(2000),
  WRITE_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  WRITE_RATE_LIMIT_MAX: z.coerce.number().default(200),
  UPLOAD_RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60 * 60 * 1000), // 1 hour
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().default(30),
});

export const env = envSchema.parse(process.env);