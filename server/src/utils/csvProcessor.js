import fs from "fs";
import readline from "readline";

// this fn process csv in streaming way so memory not full
export const processCSVStream = async (filePath, onProgress) => {
  const startTime = Date.now();

  // getting file size for progress calclation
  const { size: fileSize } = fs.statSync(filePath);

  return new Promise((resolve, reject) => {
    const fileStream = fs.createReadStream(filePath, {
      encoding: "utf8",
      highWaterMark: 64 * 1024, // small chunks to keep memory low
    });

    const rl = readline.createInterface({
      input: fileStream,
      crlfDelay: Infinity, // handle both line endings
    });

    let headers = null;
    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    const errorSample = []; // storing some errors only
    const seenHashes = new Set(); // for dupicate check
    let duplicateRows = 0;
    let bytesRead = 0;
    let lastProgressReported = 0;

    rl.on("line", (line) => {
      bytesRead += Buffer.byteLength(line, "utf8") + 1;

      // first line is header so we store it
      if (headers === null) {
        headers = parseLine(line);
        return;
      }

      totalRows++;

      // validate each row data
      const fields = parseLine(line);
      const isValid = validateRow(fields, headers, errorSample);

      if (isValid) {
        validRows++;
      } else {
        invalidRows++;
      }

      // checking duplicate rows simple way
      const normalizedLine = line.trim();
      if (seenHashes.has(normalizedLine)) {
        duplicateRows++;
      } else {
        seenHashes.add(normalizedLine);
      }

      // updating progress every few percent
      const progress = Math.min(Math.floor((bytesRead / fileSize) * 100), 99);
      if (
        progress >= lastProgressReported + 5 &&
        typeof onProgress === "function"
      ) {
        lastProgressReported = progress;
        onProgress(progress);
      }
    });

    rl.on("error", (err) => {
      console.error("CSV readline error:", err);
      reject(err);
    });

    fileStream.on("error", (err) => {
      console.error("CSV file stream error:", err);
      reject(err);
    });

    rl.on("close", () => {
      const processingTimeMs = Date.now() - startTime;
      const uniqueRows = totalRows - duplicateRows;

      // clearing set to free memory fastly
      seenHashes.clear();

      if (typeof onProgress === "function") {
        onProgress(100);
      }

      const result = {
        totalRows,
        validRows,
        invalidRows,
        duplicateRows,
        uniqueRows,
        processingTimeMs,
        headers: headers || [],
        errorSample: errorSample.slice(0, 10),
        summary: buildSummary({
          totalRows,
          validRows,
          invalidRows,
          duplicateRows,
          uniqueRows,
          processingTimeMs,
        }),
      };

      console.log(
        `CSV processed: ${totalRows} rows in ${processingTimeMs}ms (valid=${validRows}, invalid=${invalidRows}, dupes=${duplicateRows})`,
      );

      resolve(result);
    });
  });
};

// simple csv parser not fully perfect but works fine
const parseLine = (line) => {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  result.push(current.trim());
  return result;
};

// basic validation like col count and empty values
const validateRow = (fields, headers, errorSample) => {
  if (fields.length !== headers.length) {
    if (errorSample.length < 10) {
      errorSample.push(
        `Column count mismatch: expected ${headers.length}, got ${fields.length}`,
      );
    }
    return false;
  }

  const emptyIndex = fields.findIndex((f) => f === "");
  if (emptyIndex !== -1) {
    if (errorSample.length < 10) {
      errorSample.push(`Empty field in column "${headers[emptyIndex]}"`);
    }
    return false;
  }

  return true;
};

// build small summary string for logs
const buildSummary = ({
  totalRows,
  validRows,
  invalidRows,
  duplicateRows,
  uniqueRows,
  processingTimeMs,
}) => {
  const validPct =
    totalRows > 0 ? ((validRows / totalRows) * 100).toFixed(1) : "0.0";

  return (
    `Processed ${totalRows} data rows in ${processingTimeMs}ms. ` +
    `Valid: ${validRows} (${validPct}%), Invalid: ${invalidRows}, ` +
    `Duplicates: ${duplicateRows}, Unique: ${uniqueRows}.`
  );
};
