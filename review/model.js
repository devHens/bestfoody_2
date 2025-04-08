import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      //ref: "User", // currenly only using the global.dummyUser
      required: true,
    },
    reviewerName: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
    },
    pictures: [
      {
        data: { type: String, required: true },
        caption: { type: String, required: false },
      },
    ],
  },
  { timestamps: true }
);
reviewSchema.index({ restaurantId: 1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ createdAt: -1 });
reviewSchema.index({ restaurantId: 1, createdAt: -1 });
reviewSchema.index({ restaurantId: 1, rating: -1 });

const Review = mongoose.model("Review", reviewSchema);
const createReviewQuery = async (reviewData) => {
  const review = new Review(reviewData);
  return await review.save();
};

const retrieveReviewsByRestaurantId = async (
  restaurantId,
  page = 1,
  limit = 10,
  orderBy,
  rating
) => {
  const filter = { restaurantId };

  const sort = {};

  if (orderBy) {
    const sortFields = orderBy.split(",");
    sortFields.forEach((field) => {
      const [fieldName, direction] = field.split("_");
      if (["createdAt", "rating"].includes(fieldName)) {
        sort[fieldName] = direction === "desc" ? -1 : 1;
      }
    });
  }

  if (typeof rating === "number" && !isNaN(rating)) {
    filter.rating = { $eq: rating };
  }
  const skip = (page - 1) * limit;
  const reviews = await Review.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .exec();
  const totalCount = await Review.countDocuments({ restaurantId });
  const totalPages = Math.ceil(totalCount / limit);

  return { reviews, totalCount, totalPages };
};

const deleteReviewQuery = async (id) => {
  return await Review.findByIdAndDelete(id);
};

const updateReviewQuery = async (id, updateData) => {
  const review = await Review.findById(id);

  if (!review) {
    throw new Error("Review not found");
  }

  const currentTime = new Date();
  const createdAt = new Date(review.createdAt);

  const timeDifference = currentTime - createdAt;
  const minutesDifference = timeDifference / (1000 * 60);

  if (minutesDifference > 15) {
    throw new Error("time limit passed");
  }
  Object.assign(review, updateData);
  await review.save();
  return review;
};

const checkReviewOwnership = async (reviewId, userId) => {
  try {
    return (await Review.exists({ _id: reviewId, userId })) ?? false;
  } catch (error) {
    throw new Error(error.message);
  }
};
const checkIfReviewBelongToRestaurant = async (reviewId, restaurantId) => {
  try {
    return (
      (await Review.exists({
        _id: new mongoose.Types.ObjectId(reviewId),
        restaurantId: restaurantId,
      })) ?? false
    );
  } catch (error) {
    throw new Error(error.message);
  }
};
export {
  checkIfReviewBelongToRestaurant,
  createReviewQuery,
  retrieveReviewsByRestaurantId,
  deleteReviewQuery,
  checkReviewOwnership,
  updateReviewQuery,
  Review,
};
