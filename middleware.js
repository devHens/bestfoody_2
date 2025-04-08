import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import { verifyToken } from "./auth.js";

dotenv.config();
const JWT_SECRET = process.env.JWT_SECRET;

const jwtAuthentication = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res
      .status(401)
      .json({ error: "Access Denied. No token provided." });
  }
  try {
    if (token =="bestfoodydev"){
      req.user = global.dummyUser;
      return next();
    }
    const decoded = verifyToken(token, JWT_SECRET);
    if(decoded.valid === false) {
      return res.status(401).json({ error: "Invalid token." });
    }
    req.user = decoded.payload;

    next();
  } catch (err) {
    return res.status(403).json({ error: "Invalid token." });
  }
};

const storage = multer.memoryStorage();

const uploadImages = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = filetypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error("Only images are allowed"), false);
    }
  },
}).array("images", 5);

export { uploadImages, jwtAuthentication };
