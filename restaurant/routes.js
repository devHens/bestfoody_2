import express from "express";
import {
  createRestaurant,
  getRestaurantById,
  getRestaurants,
  updateRestaurant,
  deleteRestaurant,
} from "./controller.js";
import { jwtAuthentication } from "../middleware.js";

const router = express.Router();

router.get("/", getRestaurants);
router.get("/:restaurantId", getRestaurantById);
router.put("/:restaurantId", jwtAuthentication, updateRestaurant);
router.post("/", jwtAuthentication, createRestaurant);
router.delete("/:restaurantId", jwtAuthentication, deleteRestaurant);

export default router;
