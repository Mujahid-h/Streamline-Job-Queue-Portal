import { v4 as uuidv4 } from "uuid";
import Job from "../models/Job.js";
import { enqueueFileJob } from "../queues/fileProcessingQueue.js";

export const uploadFile = async (req, res, next) => {
  try {
    const {
      originalFilename,
      storedFilename,
      filePath,
      fileSizeBytes,
      mimeType,
    } = req.uploadedFile;

    const priority = Math.min(
      Math.max(parseInt(req.body?.priority) || 0, 0),
      10,
    );

    const jobId = uuidv4();
    const job = await Job.create({
      jobId,
      status: "pending",
      priority,
      originalFilename,
      storedFilename,
      filePath,
      fileSizeBytes,
      mimeType,
    });

    await enqueueFileJob(
      {
        jobId,
        filePath,
        originalFilename,
        priority,
      },
      { priority },
    );

    console.log(
      `File uploaded: ${originalFilename} (${(fileSizeBytes / 1024 / 1024).toFixed(2)} MB), jobId: ${jobId}`,
    );

    return res.status(202).json({
      success: true,
      message: "File uploaded and queued for processing",
      data: {
        jobId,
        status: job.status,
        originalFilename,
        fileSizeBytes,
        priority,
      },
    });
  } catch (err) {
    next(err);
  }
};
