import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { Restaurant } from "./restaurant/model.js";
import { Review } from "./review/model.js";
import { config } from "./config.js";

const MONGO_URI = config.MONGO_URI;

async function seedData() {
  try {
    await mongoose.connect(MONGO_URI);

    const dummyUser = {
      _id: "67f3d7983ff6240012661eef",
      name: "testUser",
      role: "user",
    };
    await Restaurant.deleteMany({});
    await Review.deleteMany({});
    console.log("Old data cleared");
    const seedRestaurants = [
      {
        name: "Shake Shack",
        category: "Fast Food",
        owner: dummyUser._id,
        pictures: [{ data: "shakeshack1.jpg" }],
      },
      {
        name: "KFC",
        category: "Fast Food",
        owner: dummyUser._id,
        pictures: [{ data: "kfc1.jpg" }],
      },
      {
        name: "McDonald's",
        category: "Fast Food",
        owner: dummyUser._id,
        pictures: [{ data: "mcdonalds1.jpg" }],
      },

      {
        name: "Olive Garden",
        category: "Italian",
        owner: dummyUser._id,
        pictures: [{ data: "olivegarden1.jpg" }],
      },
      {
        name: "Pizza Hut",
        category: "Italian",
        owner: dummyUser._id,
        pictures: [{ data: "pizzahut1.jpg" }],
      },

      {
        name: "Din Tai Fung",
        category: "Chinese",
        owner: dummyUser._id,
        pictures: [{ data: "dintaifung1.jpg" }],
      },
      {
        name: "Panda Express",
        category: "Chinese",
        owner: dummyUser._id,
        pictures: [{ data: "pandaexpress1.jpg" }],
      },

      {
        name: "Starbucks",
        category: "Cafe",
        owner: dummyUser._id,
        pictures: [{ data: "starbucks1.jpg" }],
      },
      {
        name: "Coffee Bean",
        category: "Cafe",
        owner: dummyUser._id,
        pictures: [{ data: "coffeebean1.jpg" }],
      },

      {
        name: "Baskin Robbins",
        category: "Desserts",
        owner: dummyUser._id,
        pictures: [{ data: "baskinrobbins1.jpg" }],
      },
    ];

    const insertedRestaurants = await Restaurant.insertMany(seedRestaurants);
    console.log("Restaurants inserted");

    const reviews = [
      {
        restaurantId: insertedRestaurants[0]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 4,
        comment: "Tasty burgers!",
        pictures: [{ data: "shake1.jpg" }],
      },
      {
        restaurantId: insertedRestaurants[0]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 5,
        comment: "Loved the fries!",
        pictures: [{ data: "fries.jpg" }],
      },

      {
        restaurantId: insertedRestaurants[1]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 3,
        comment: "Chicken was too salty.",
        pictures: [{ data: "kfc.jpg" }],
      },

      {
        restaurantId: insertedRestaurants[2]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 4,
        comment: "Fast service!",
        pictures: [{ data: "mcdonalds.jpg" }],
      },

      {
        restaurantId: insertedRestaurants[3]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 5,
        comment: "Pasta was amazing!",
        pictures: [{ data: "pasta.jpg" }],
      },
      {
        restaurantId: insertedRestaurants[4]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 4,
        comment: "Good pizza but crust was hard.",
        pictures: [{ data: "pizza.jpg" }],
      },

      {
        restaurantId: insertedRestaurants[5]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 5,
        comment: "Best dumplings I've ever had!",
        pictures: [{ data: "dumplings.jpg" }],
      },
      {
        restaurantId: insertedRestaurants[6]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 4,
        comment: "Nice Orange Chicken.",
        pictures: [{ data: "orangechicken.jpg" }],
      },

      {
        restaurantId: insertedRestaurants[7]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 5,
        comment: "Best coffee!",
        pictures: [{ data: "coffee.jpg" }],
      },
      {
        restaurantId: insertedRestaurants[8]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 3,
        comment: "Average experience.",
        pictures: [{ data: "coffee2.jpg" }],
      },
      // Desserts
      {
        restaurantId: insertedRestaurants[9]._id,
        userId: dummyUser._id,
        reviewerName: dummyUser.name,
        rating: 4,
        comment: "Ice cream was good but too sweet.",
        pictures: [{ data: "icecream.jpg" }],
      },
    ];

    await Review.insertMany(reviews);
    console.log("Reviews inserted");
  } catch (error) {
    console.error("Error seeding data:", error);
  } finally {
    mongoose.connection.close();
    console.log("Disconnected from MongoDB");
  }
}

seedData();
