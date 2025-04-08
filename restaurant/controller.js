import {
  updateRestaurantQuery,
  createRestaurantQuery,
  retrieveRestaurants,
  retrieveRestaurantById,
  deleteRestaurantQuery,
  checkRestaurantOwnership,
} from "./model.js";
import { uploadImages } from "../middleware.js";
import { isValidObjectId } from "mongoose";

const getRestaurants = async (req, res) => {
  try {
    const { name, category, averageRating, orderBy, hasPicture } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }

    const hasPictureValue =
      hasPicture === "1" ? true : hasPicture === "0" ? false : undefined;

    const filters = {
      name,
      category,
      averageRating: parseFloat(averageRating),
      hasPicture: hasPictureValue,
    };
    const { restaurants, totalCount, totalPages } = await retrieveRestaurants(
      filters,
      page,
      limit,
      orderBy
    );

    res
      .status(200)
      .json({ restaurants, totalCount, totalPages, currentPage: page });
  } catch (error) {
    console.error("Error in getRestaurants:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while fetching restaurants.",
    });
  }
};

const getRestaurantById = async (req, res) => {
  const { restaurantId } = req.params;
  const { orderBy } = req.query;

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
    return res
      .status(400)
      .json({ error: "Page and limit must be positive integers." });
  }

  if (!isValidObjectId(restaurantId)) {
    return res
      .status(400)
      .json({
        error: "req.params.restaurantId is not a valid ObjectId format.",
      });
  }

  const rating = req.query.rating ? parseInt(req.query.rating) : undefined;
  try {
    const restaurant = await retrieveRestaurantById(
      restaurantId,
      page,
      limit,
      rating,
      orderBy
    );
    if (!restaurant) {
      return res.status(404).json({ error: "Restaurant not found." });
    }
    restaurant.reviewTotalPage = Math.ceil(restaurant.totalReviews / limit);
    restaurant.reviewCurrentPage = page;
    restaurant.reviewLimit = limit;
    res.status(200).json({ restaurant });
  } catch (error) {
    console.error("Error in getRestaurantById:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while fetching the restaurant.",
    });
  }
};

const createRestaurant = async (req, res) => {
  try {
    uploadImages(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: "req.file error: " + err.message });
      }
      if (!req.body || !req.body.name || !req.body.category) {
        return res
          .status(400)
          .json({ error: "req.body.name and req.body.category are required." });
      }
      const { name, category, images } = req.body;
      const owner = req.user._id;

      let pictures = [];

      if (images && typeof images === "string") {
        const imageUrls = images.split(",");
        if (imageUrls.length > 5) {
          return res
            .status(400)
            .json({ error: "Maximum of 5 images allowed." });
        }

        imageUrls.forEach((url) => {
          pictures.push({ data: url.trim() });
        });
      } else if (req.files && req.files.length > 0) {
        req.files.forEach((file) => {
          const base64Image = file.buffer.toString("base64");
          pictures.push({
            data: `data:${file.mimetype};base64,${base64Image}`,
          });
        });
      }

      await createRestaurantQuery({ owner, name, category, pictures });

      res.status(201).json({ message: "Restaurant created successfully." });
    });
  } catch (error) {
    console.error("Error in createRestaurant:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while creating the restaurant.",
    });
  }
};

const updateRestaurant = async (req, res) => {
  const { restaurantId } = req.params;
  if (!isValidObjectId(restaurantId)) {
    return res
      .status(400)
      .json({
        error: "req.params.restaurantId is not a valid ObjectId format.",
      });
  }

  if (req.body.owner) {
    return res.status(400).json({ message: "Owner field cannot be modified." });
  }
  const isOwner = await checkRestaurantOwnership(restaurantId, req.user._id);
  if (!isOwner) {
    return res.status(403).json({
      error: "req.user._id does not have permission to update this restaurant.",
    });
  }

  try {
    const updatedRestaurant = await updateRestaurantQuery(
      restaurantId,
      req.body
    );

    res.status(200).json({
      message: "Restaurant updated successfully.",
      restaurant: updatedRestaurant,
    });
  } catch (error) {
    console.error("Error in updateRestaurant:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while updating the restaurant.",
    });
  }
};

const deleteRestaurant = async (req, res) => {
  const { restaurantId } = req.params;

  if (!isValidObjectId(restaurantId)) {
    return res
      .status(400)
      .json({
        error: "req.params.restaurantId is not a valid ObjectId format.",
      });
  }

  const isOwner = await checkRestaurantOwnership(restaurantId, req.user._id);
  if (!isOwner) {
    return res.status(403).json({
      error: "req.user._id does not have permission to delete this restaurant.",
    });
  }

  try {
    await deleteRestaurantQuery(restaurantId);
    res.status(200).json({ message: "Restaurant deleted successfully." });
  } catch (error) {
    console.error("Error in deleteRestaurant:", error.message);
    res.status(500).json({
      error: "An unexpected error occurred while deleting the restaurant.",
    });
  }
};

export {
  getRestaurants,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  getRestaurantById,
};
