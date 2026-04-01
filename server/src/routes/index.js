import express from "express";
import uploadRoutes from "./uploadRoutes.js";
import jobRoutes from "./jobRoutes.js";

const router = express.Router();

router.use("/api", uploadRoutes);
router.use("/api", jobRoutes);

export default router;
