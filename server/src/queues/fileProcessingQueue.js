import { createRedisConnection } from "../config/redis.js";
import { Queue } from "bullmq";

export const QUEUE_NAME = process.env.QUEUE_NAME || "file-processing";

const queueConnection = createRedisConnection(); // redis connection established using ioredis

export const fileProcessingQueue = new Queue(QUEUE_NAME, {
  connection: queueConnection,
  defaultJobOptions: {
    attempts: parseInt(process.env.JOB_RETRY_ATTEMPTS) || 3, // max 3 attempts on failed uploaded files
    backoff: {
      type: "exponential",
      delay: parseInt(process.env.JOB_RETRY_DELAY_MS) || 5000,
    },
    removeOnComplete: {
      count: 1000,
      age: 24 * 60 * 60,
    },
    removeOnFail: {
      count: 500,
      age: 7 * 24 * 60 * 60,
    },
  },
});

fileProcessingQueue.on("error", (err) => {
  console.error("Queue error:", err.message);
});

export const enqueueFileJob = async (jobData, options = {}) => {
  const priority = jobData.priority || 0;

  const bullJob = await fileProcessingQueue.add("process-csv", jobData, {
    priority, // Priority of given from the client side else defualt is zero for evry new fie upload
    jobId: jobData.jobId,
    ...options,
  });

  console.log(`Job enqueued: ${jobData.jobId} (bullJobId: ${bullJob.id})`);
  return bullJob;
};
