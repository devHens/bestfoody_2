import {
  checkReviewOwnership,
  checkIfReviewBelongToRestaurant,
  createReviewQuery,
  deleteReviewQuery,
  retrieveReviewsByRestaurantId,
  updateReviewQuery,
} from "./model.js";
import { checkRestaurantOwnership } from "../restaurant/model.js";
import { uploadImages } from "../middleware.js";
import { isValidObjectId } from "mongoose";

const createReview = async (req, res) => {
  const { restaurantId } = req.params;
  if (!isValidObjectId(restaurantId)) {
    return res.status(400).json({
      error: "req.params.restaurantId is not a valid ObjectId format.",
    });
  }

  try {
    uploadImages(req, res, async (err) => {
      if (err) {
        return res
          .status(400)
          .json({ error: "req.file error: " + err.message });
      }
      if (!req.body) {
        return res.status(400).json({ error: "req.body is required." });
      }
      let { rating, comment, images } = req.body;
      const userId = req.user?._id;
      const reviewerName = req.user?.name;

      if (!rating) {
        return res.status(400).json({ error: "req.body.rating is required." });
      }

      rating = parseInt(rating);

      if (isNaN(rating) || rating < 1 || rating > 5) {
        return res
          .status(400)
          .json({ error: "req.body.rating must be a number between 1 and 5." });
      }

      let pictures = [];

      if (images && typeof images === "string") {
        const imageUrls = images.split(",");
        if (imageUrls.length > 5) {
          return res.status(400).json({
            error:
              "req.body.images exceeds the upload limit. A maximum of 5 images is allowed.",
          });
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

      await createReviewQuery({
        restaurantId,
        userId,
        rating,
        comment,
        pictures,
        reviewerName,
      });

      res.status(201).json({ message: "Review created successfully." });
    });
  } catch (error) {
    console.error("Error in createReview:", error.message);
    res.status(500).json({
      error:
        "An unexpected error occurred while creating the review. Please try again later.",
    });
  }
};

const getRestaurantReviews = async (req, res) => {
  try {
    const { restaurantId } = req.params;

    if (!isValidObjectId(restaurantId)) {
      return res.status(400).json({
        error: "req.params.restaurantId is not a valid ObjectId format.",
      });
    }

    const orderBy = req.query.orderBy || "createdAt";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page and limit must be positive integers." });
    }
    const rating = req.query.rating ? parseInt(req.query.rating) : undefined;

    const { reviews, totalCount, totalPages } =
      await retrieveReviewsByRestaurantId(
        restaurantId,
        page,
        limit,
        orderBy,
        rating
      );

    res.status(200).json({
      reviews,
      totalCount,
      totalPages,
      currentPage: page,
    });
  } catch (error) {
    console.error("Error in getRestaurantReviews:", error.message);
    res.status(500).json({
      error:
        "An unexpected error occurred while retrieving reviews. Please try again later.",
    });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId, restaurantId } = req.params;

    if (!isValidObjectId(restaurantId)) {
      return res.status(400).json({
        error: "req.params.restaurantId is not a valid ObjectId format.",
      });
    }
    if (!isValidObjectId(reviewId)) {
      return res
        .status(400)
        .json({ error: "req.params.reviewId is not a valid ObjectId format." });
    }
    if (!req.body) {
      return res.status(400).json({ error: "req.body is required." });
    }
    const { rating } = req.body;
    if (rating && (isNaN(parseInt(rating)) || rating < 1 || rating > 5)) {
      return res
        .status(400)
        .json({ error: "req.body.rating must be a number between 1 and 5." });
    }

    const isOwner = await checkReviewOwnership(reviewId, req.user._id);
    if (!isOwner) {
      return res.status(403).json({
        error:
          "req.user._id does not have permission to update this review or it does not exist.",
      });
    }

    const updatedReview = await updateReviewQuery(reviewId, req.body);

    res.status(200).json({
      message: "Review updated successfully.",
      review: updatedReview,
    });
  } catch (error) {
    console.error("Error in updateReview:", error.message);
    if (error.message === "time limit passed") {
      res.status(500).json({
        error: "Time allocation for editing review has passed.",
      });
    } else {
      res.status(500).json({
        error:
          "An unexpected error occurred while updating the review. Please try again later.",
      });
    }
  }
};

const deleteReview = async (req, res) => {
  try {
    const { restaurantId, reviewId } = req.params;

    if (!isValidObjectId(restaurantId)) {
      return res.status(400).json({
        error: "req.params.restaurantId is not a valid ObjectId format.",
      });
    }
    if (!isValidObjectId(reviewId)) {
      return res
        .status(400)
        .json({ error: "req.params.reviewId is not a valid ObjectId format." });
    }

    const isReviewBelongToRestaurant = await checkIfReviewBelongToRestaurant(
      reviewId,
      restaurantId
    );
    if (!isReviewBelongToRestaurant) {
      return res
        .status(404)
        .json({ error: "Review not found for the specified restaurant." });
    }

    const [isRestaurantOwner, isReviewOwner] = await Promise.all([
      checkRestaurantOwnership(restaurantId, req.user._id),
      checkReviewOwnership(reviewId, req.user._id),
    ]);

    if (!isRestaurantOwner && !isReviewOwner) {
      return res.status(403).json({
        error:
          "req.user._id does not have permission to delete this review or it does not exist.",
      });
    }
    const deletedReview = await deleteReviewQuery(reviewId);

    if (!deletedReview) {
      return res
        .status(404)
        .json({ error: "Review not found. Please provide a valid reviewId." });
    }

    res.status(200).json({ message: "Review deleted successfully." });
  } catch (error) {
    console.error("Error in deleteReview:", error.message);
    res.status(500).json({
      error:
        "An unexpected error occurred while deleting the review. Please try again later.",
    });
  }
};

export { createReview, getRestaurantReviews, updateReview, deleteReview };
