import Job from "../models/Job.js";
import { fileProcessingQueue } from "../queues/fileProcessingQueue.js";

export const getJobStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({ jobId: id }).lean();

    if (!job) {
      return res.status(404).json({
        success: false,
        error: `Job not found: ${id}`,
      });
    }

    const response = {
      success: true,
      data: {
        jobId: job.jobId,
        status: job.status,
        progress: job.progress,
        priority: job.priority,
        originalFilename: job.originalFilename,
        fileSizeBytes: job.fileSizeBytes,
        attempts: job.attempts,
        maxAttempts: job.maxAttempts,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        completedAt: job.completedAt,
      },
    };

    if (job.status === "completed" && job.result) {
      response.data.result = job.result; // to include job result only if the job is completed
    }

    if (job.status === "failed") {
      response.data.errorMessage = job.errorMessage; // to include error message only if the job is failed
    }

    return res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};

export const listJobs = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [jobs, total] = await Promise.all([
      Job.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean()
        .select("-filePath -storedFilename -result.errorSample"),
      Job.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getQueueStats = async (req, res, next) => {
  try {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      fileProcessingQueue.getWaitingCount(),
      fileProcessingQueue.getActiveCount(),
      fileProcessingQueue.getCompletedCount(),
      fileProcessingQueue.getFailedCount(),
      fileProcessingQueue.getDelayedCount(),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        queue: {
          name: fileProcessingQueue.name,
          waiting,
          active,
          completed,
          failed,
          delayed,
          total: waiting + active + completed + failed + delayed,
        },
      },
    });
  } catch (err) {
    next(err);
  }
};
