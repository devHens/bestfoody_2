import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


export const connectMongo = async (mongoUri) => {
  try {
    await mongoose.connect(mongoUri);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};
