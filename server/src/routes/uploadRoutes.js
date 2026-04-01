import express from "express";
import streamUpload from "../middlewares/uploadMiddleware.js";
import { uploadFile } from "../controllers/index.js";
import rateLimit from "express-rate-limit";

const router = express.Router();

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many upload requests, please try again later.",
  },
});

router.post("/upload", uploadLimiter, streamUpload, uploadFile);

export default router;
