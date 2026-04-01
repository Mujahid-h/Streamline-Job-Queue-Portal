import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

let redisClient = null;


export const createRedisConnection = (options = {}) => {
    try {
        const connection =
        process.env.REDIS_URL &&
        new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: null,
          ...options,
        });
      
        connection.on("connect", () => console.log("Redis connected"));
        connection.on("error", (err) => console.error("Redis error:", err.message));
        connection.on("close", () => console.warn("Redis connection closed"));
      
        return connection;
    } catch (error) {
        console.error("Redis connection error:", error);
        process.exit(1);
    }

   
  };
  
export const getRedisClient = () => {
    if (!redisClient) {
      redisClient = createRedisConnection();
    }
    return redisClient;
  };

  