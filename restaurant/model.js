import mongoose from "mongoose";
const { Schema } = mongoose;
const restaurant = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      // ref: "User", // temp connect to global.dummyUser
      required: true,
    },
    pictures: [
      {
        data: { type: String, required: true },
      },
    ],
  },
  { timestamps: true }
);

restaurant.index({ name: 1 });
restaurant.index({ category: 1 });
restaurant.index({ name: 1, category: 1 });
restaurant.index({ averageRating: 1 });
restaurant.index({ averageRating: -1 });
restaurant.index({ category: 1, averageRating: -1 });
restaurant.index({ category: 1, name: 1, averageRating: -1 });
restaurant.index({ createdAt: -1 });

const Restaurant = mongoose.model("Restaurant", restaurant);
const retrieveRestaurants = async (filters, page = 1, limit = 10, orderBy) => {
  try {
    const { name, category, averageRating, hasPicture } = filters;

    const filter = {};
    if (name) filter.name = { $regex: name, $options: "i" };
    if (category) filter.category = { $regex: category, $options: "i" };

    if (typeof averageRating === "number" && !isNaN(averageRating)) {
      const ratingValue = parseFloat(averageRating);
      filter.averageRating = { $gte: ratingValue, $lt: ratingValue + 1 };
    }
    if (hasPicture !== undefined) {
      filter.pictures = hasPicture
        ? { $type: "array", $exists: true, $ne: [], $not: { $size: 0 } }
        : { $size: 0 };
    }

    const skip = (page - 1) * limit;

    let sort = { createdAt: -1 };

    if (orderBy) {
      const sortFields = orderBy.split(",");
      sort = {};
      sortFields.forEach((field) => {
        const [fieldName, direction] = field.split("_");
        if (["name", "averageRating", "createdAt"].includes(fieldName)) {
          sort[fieldName] = direction === "desc" ? -1 : 1;
        }
      });
    }

    const restaurants = await Restaurant.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "restaurantId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$reviews" }, 0] },
              then: { $round: [{ $avg: "$reviews.rating" }, 1] },
              else: 0,
            },
          },
          reviews: {
            $slice: [
              {
                $sortArray: {
                  input: "$reviews",
                  sortBy: { createdAt: -1 },
                },
              },
              3,
            ],
          },
        },
      },
      { $match: filter },
      { $sort: sort },
      { $skip: skip },
      { $limit: limit },
    ]);

    const totalCount = await Restaurant.countDocuments(filter);

    return {
      restaurants,
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

const retrieveRestaurantById = async (
  restaurantId,
  page = 1,
  limit = 10,
  rating,
  orderBy
) => {
  try {
    const skip = (page - 1) * limit;

    let sortCriteria = { createdAt: -1 };

    if (orderBy) {
      const sortFields = orderBy.split(",");
      sortCriteria = {};
      sortFields.forEach((field) => {
        const [fieldName, direction] = field.split("_");
        if (["rating", "createdAt"].includes(fieldName)) {
          sortCriteria[fieldName] = direction === "desc" ? -1 : 1;
        }
      });
    }

    const filter = { restaurantId: new mongoose.Types.ObjectId(restaurantId) };
    if (typeof rating === "number" && !isNaN(rating)) {
      filter.rating = rating;
    }
    const result = await Restaurant.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(restaurantId) },
      },
      {
        $lookup: {
          from: "reviews",
          let: { restaurantId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$restaurantId", "$$restaurantId"] } } },
            { $match: filter },
            { $sort: sortCriteria },
            { $skip: skip },
            { $limit: limit },
          ],
          as: "reviews",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "restaurantId",
          as: "allReviews",
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $gt: [{ $size: "$allReviews" }, 0] },
              then: { $round: [{ $avg: "$allReviews.rating" }, 1] },
              else: 0,
            },
          },
          totalReviews: { $size: "$allReviews" },
        },
      },
      {
        $project: {
          allReviews: 0,
        },
      },
    ]);

    if (!result.length) {
      throw new Error("Restaurant not found or no reviews available");
    }

    return result[0];
  } catch (error) {
    throw new Error(error.message);
  }
};

const createRestaurantQuery = async (data) => {
  const restaurant = new Restaurant(data);
  return await restaurant.save();
};
const updateRestaurantQuery = async (restaurantId, updates) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      restaurantId,
      updates,
      { new: true }
    );
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
    return restaurant;
  } catch (error) {
    throw new Error(error.message);
  }
};
const deleteRestaurantQuery = async (restaurantId) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(restaurantId);
    if (!restaurant) {
      throw new Error("Restaurant not found");
    }
  } catch (error) {
    throw new Error(error.message);
  }
};
const checkRestaurantOwnership = async (restaurantId, userId) => {
  try {
    return (
      (await Restaurant.exists({ _id: restaurantId, owner: userId })) ?? false
    );
  } catch (error) {
    throw new Error(error.message);
  }
};

export {
  Restaurant,
  createRestaurantQuery,
  retrieveRestaurants,
  retrieveRestaurantById,
  updateRestaurantQuery,
  deleteRestaurantQuery,
  checkRestaurantOwnership,
};
