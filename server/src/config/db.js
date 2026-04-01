import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const connectDB = async () => {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/job-queue-system';
  
    try {
      await mongoose.connect(uri);
      console.log('MongoDB connected successfully');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      process.exit(1);
    }
  
  
  };
  
  export default connectDB;