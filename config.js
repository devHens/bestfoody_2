import dotenv from "dotenv";
dotenv.config();

const requiredEnvVars = ["MONGO_URI", "PORT", "JWT_SECRET"];

const missingVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingVars.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missingVars.join(", ")}`
  );
}

export const config = {
  MONGO_URI: process.env.MONGO_URI,
  PORT: parseInt(process.env.PORT, 10),
  JWT_SECRET: process.env.JWT_SECRET,
};
