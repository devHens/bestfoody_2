import express from "express";
import {
  createReview,
  updateReview,
  deleteReview,
  getRestaurantReviews,
} from "./controller.js";
import { jwtAuthentication } from "../middleware.js";

const router = express.Router();

router.get("/", updateReview);

router.get("/:restaurantId/review", getRestaurantReviews);
router.post("/:restaurantId/review", jwtAuthentication, createReview);
router.put("/:restaurantId/review/:reviewId", jwtAuthentication, updateReview);
router.delete("/:restaurantId/review/:reviewId", jwtAuthentication, deleteReview);
export default router;
