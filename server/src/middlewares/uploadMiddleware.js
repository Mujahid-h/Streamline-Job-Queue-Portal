import path from "path";
import fs, { createWriteStream } from "fs";
import busboy from "busboy";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || "./uploads");

const MAX_FILE_SIZE_BYTES =
  parseInt(process.env.MAX_FILE_SIZE_MB || "500") * 1024 * 1024;

// file type validations only csv is allowed
const ALLOWED_MIME_TYPES = (
  process.env.ALLOWED_FILE_TYPES || "text/csv,application/csv"
)
  .split(",")
  .map((t) => t.trim());

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
} // check if upload directory exists if not then create oe

const streamUpload = (req, res, next) => {
  const contentType = req.headers["content-type"] || "";

  if (!contentType.includes("multipart/form-data")) {
    return res.status(400).json({
      success: false,
      error: "Request must be multipart/form-data",
    });
  }

  let fileReceived = false;
  let fileSizeBytes = 0;
  let storedFilename = null;
  let filePath = null;
  let originalFilename = null;
  let mimeType = null;
  let priorityValue = null; // multipart field "priority" sent by the client
  let writeStream = null;
  let aborted = false;

  const bb = busboy({
    headers: req.headers,
    limits: {
      files: 1, // Only one file per request
      fileSize: MAX_FILE_SIZE_BYTES,
    },
  });

  bb.on("file", (fieldname, fileStream, info) => {
    const { filename, mimeType: detectedMime } = info;
    mimeType = detectedMime;
    originalFilename = filename;

    // Validate MIME type early
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      aborted = true;
      fileStream.resume();
      return res.status(400).json({
        success: false,
        error: `Unsupported file type: ${mimeType}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}`,
      });
    }

    const ext = path.extname(filename) || ".csv";
    storedFilename = `${uuidv4()}${ext}`;
    filePath = path.join(UPLOAD_DIR, storedFilename);

    writeStream = createWriteStream(filePath);
    fileReceived = true;

    // Pipe the upload stream directly to disk — no buffering
    fileStream.pipe(writeStream);

    fileStream.on("data", (chunk) => {
      fileSizeBytes += chunk.length;
    });

    fileStream.on("limit", () => {
      aborted = true;
      writeStream.destroy();
      fs.unlink(filePath, () => { });

      if (!res.headersSent) {
        return res.status(413).json({
          success: false,
          error: `File too large. Maximum allowed size is ${process.env.MAX_FILE_SIZE_MB || 500}MB`,
        });
      }
    });

    fileStream.on("error", (err) => {
      console.error("File stream error during upload:", err);
      aborted = true;
      writeStream.destroy();
      if (fs.existsSync(filePath)) fs.unlink(filePath, () => { });
    });
  });

  bb.on("field", (fieldname, value) => {
    // busboy parses non-file multipart fields; we forward priority to the controller.
    if (fieldname === "priority") {
      priorityValue = value;
    }
  });

  bb.on("finish", () => {
    if (aborted) return;

    if (!fileReceived) {
      return res.status(400).json({
        success: false,
        error: 'No file found in request. Use field name "file".',
      });
    }

    writeStream.on("finish", () => {
      req.uploadedFile = {
        originalFilename,
        storedFilename,
        filePath,
        fileSizeBytes,
        mimeType,
      };

      // `uploadControllers` reads `req.body.priority`, but with streaming multipart
      // uploads we don't have an express body parser. Attach it manually.
      req.body = req.body || {};
      if (priorityValue !== null) {
        req.body.priority = priorityValue;
      }

      next();
    });

    writeStream.on("error", (err) => {
      console.error("Write stream error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to save uploaded file",
      });
    });
  });

  bb.on("error", (err) => {
    console.error("Busboy error:", err);
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        error: "File upload failed",
      });
    }
  });

  req.pipe(bb);
};

export default streamUpload;
