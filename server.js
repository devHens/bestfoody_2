import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import restoranRoutes from "./restaurant/routes.js";
import reviewRoutes from "./review/routes.js";

import { connectMongo } from "./db.js";
import { config } from "./config.js";

dotenv.config();

const app = express();
const PORT = config.PORT;
const MONGO_URI = config.MONGO_URI;
const corsOptions = {
  origin: ["http://localhost:3000"],
  methods: "GET,POST,PUT,DELETE",
};

global.dummyUser = {
  _id: "67f3d7983ff6240012661eef",
  name: "testUser",
  role: "user",
};

app.use(cors(corsOptions));

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const apiRouter = express.Router();
apiRouter.use("/restaurants", restoranRoutes);
apiRouter.use("/restaurants", reviewRoutes);

app.use("/api/v1", apiRouter);
const startServer = async () => {
  try {
    await connectMongo(MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(" Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
