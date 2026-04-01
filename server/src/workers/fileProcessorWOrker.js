import dotenv from "dotenv";
dotenv.config();

import { Worker } from "bullmq";
import fs from "fs";

import connectDB from "../config/db.js";
import { createRedisConnection } from "../config/redis.js";
import Job from "../models/Job.js";
import { processCSVStream } from "../utils/csvProcessor.js";
import { QUEUE_NAME } from "../queues/fileProcessingQueue.js";

const MAX_CONCURRENCY = parseInt(process.env.MAX_CONCURRENCY) || 5;

const workerConnection = createRedisConnection();

const processJob = async (bullJob) => {
  const { jobId, filePath } = bullJob.data;

  console.log(`Processing job ${jobId} (bull: ${bullJob.id})`);

  await Job.findOneAndUpdate(
    { jobId },
    { status: "processing", startedAt: new Date(), bullJobId: bullJob.id },
  ); // uppdate job status in db

  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  // CSV file type process streaming
  const result = await processCSVStream(filePath, async (progress) => {
    await bullJob.updateProgress(progress);
    await Job.updateOne({ jobId }, { progress });
  });

  await Job.findOneAndUpdate(
    { jobId },
    {
      status: "completed",
      progress: 100,
      completedAt: new Date(),
      result: {
        totalRows: result.totalRows,
        validRows: result.validRows,
        invalidRows: result.invalidRows,
        duplicateRows: result.duplicateRows,
        uniqueRows: result.uniqueRows,
        processingTimeMs: result.processingTimeMs,
        summary: result.summary,
        errorSample: result.errorSample,
      },
    },
  ); // mark job sttus as completed in db

  console.log(`Job ${jobId} completed successfully.`);

  return result;
};

// Worket that process the jobs in queues and update status in db
const startWorker = async () => {
  await connectDB();

  const worker = new Worker(QUEUE_NAME, processJob, {
    connection: workerConnection,
    concurrency: MAX_CONCURRENCY,
    lockDuration: 5 * 60 * 1000,
    lockRenewTime: 30 * 1000,
  });

  worker.on("completed", (job) => {
    console.log(`[Worker] Job ${job.data.jobId} completed (bull: ${job.id})`);
  });

  worker.on("failed", async (job, err) => {
    console.error(`[Worker] Job ${job?.data?.jobId} failed: ${err.message}`);

    if (!job) return;

    const isLastAttempt = job.attemptsMade >= (job.opts.attempts || 3);

    await Job.findOneAndUpdate(
      { jobId: job.data.jobId },
      {
        status: isLastAttempt ? "failed" : "pending",
        errorMessage: err.message,
        attempts: job.attemptsMade,
      },
    );
  });

  worker.on("progress", (job, progress) => {
    console.log(`[Worker] Job ${job.data.jobId} progress: ${progress}%`);
  });

  worker.on("error", (err) => {
    console.error("[Worker] Worker-level error:", err.message);
  });

  const shutdown = async (signal) => {
    console.log(`${signal} received — shutting down worker gracefully...`);
    await worker.close();
    process.exit(0);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  console.log(
    `Worker started. Queue: "${QUEUE_NAME}", Concurrency: ${MAX_CONCURRENCY}`,
  );
};

startWorker().catch((err) => {
  console.error("Worker failed to start:", err);
  process.exit(1);
});
