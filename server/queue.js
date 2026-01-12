import { Queue } from 'bullmq';
import dotenv from 'dotenv';

dotenv.config();

// Connect to your local Redis (which you are installing via WSL)
const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379
};

// Create the 'hr-outreach' queue
export const emailQueue = new Queue('hr-outreach', { connection });

console.log('📬 Email Queue Initialized');