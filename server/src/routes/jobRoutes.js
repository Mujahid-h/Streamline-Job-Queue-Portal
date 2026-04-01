import express from "express";

import { getJobStatus, listJobs, getQueueStats } from "../controllers/index.js";

const router = express.Router();

router.get("/job/:id", getJobStatus);

router.get("/jobs", listJobs); // to get all the jobs

router.get("/queue/stats", getQueueStats); // all the jobs in the queue stats

router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
}); // health check endpoint (for testing purpose

export default router;
