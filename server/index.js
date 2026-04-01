import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import routes from "./src/routes/index.js";

import connectDB from "./src/config/db.js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/", routes);

const start = async () => {
  await connectDB();

  const server = app.listen(PORT, () => {
    console.log(
      `Server running on http://localhost:${PORT} [${process.env.NODE_ENV || "development"}]`,
    );
    console.log(
      "Worker process needs to be started  separately via command : npm run worker",
    );
  });
};

start();
