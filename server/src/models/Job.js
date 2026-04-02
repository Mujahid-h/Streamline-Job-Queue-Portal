import mongoose from "mongoose";

const JobResultSchema = new mongoose.Schema(
  {
    totalRows: {
      type: Number,
      default: 0,
    },
    validRows: {
      type: Number,
      default: 0,
    },
    invalidRows: {
      type: Number,
      default: 0,
    },
    duplicateRows: {
      type: Number,
      default: 0,
    },
    uniqueRows: {
      type: Number,
      default: 0,
    },
    processingTimeMs: {
      type: Number,
      default: 0,
    },
    summary: {
      type: String,
    },
    errorSample: [{ type: String }],
  },
  { _id: false },
);

const JobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    bullJobId: {
      type: String,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true,
    },
    priority: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    originalFilename: { type: String, required: true },
    storedFilename: { type: String, required: true },
    filePath: { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    mimeType: { type: String },
    attempts: { type: Number, default: 1 },
    maxAttempts: { type: Number, default: 3 },
    errorMessage: { type: String },
    result: { type: JobResultSchema },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  },
);

JobSchema.virtual("durationMs").get(function () {
  if (this.startedAt && this.completedAt) {
    return this.completedAt - this.startedAt;
  }
  return null;
});

JobSchema.index({ status: 1, createdAt: -1 });

JobSchema.index(
  { completedAt: 1 },
  {
    expireAfterSeconds: 7 * 24 * 60 * 60,
    partialFilterExpression: { status: { $in: ["completed", "failed"] } },
  },
);

const Job = mongoose.model("Job", JobSchema);
export default Job;
