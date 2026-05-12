import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";

const router = express.Router();

/**
 * GET REVIEWS FOR A LISTING
 */
router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        message: "Invalid listing ID",
      });
    }

    const reviews = await Review.find({
      listingId,
      approved: true,
    }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
          ).toFixed(1)
        : 0;

    res.json({
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to load reviews",
    });
  }
});

/**
 * CREATE REVIEW
 */
router.post("/", async (req, res) => {
  try {
    const { listingId, name, rating, comment } = req.body;

    if (!listingId || !name || !rating || !comment) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const review = await Review.create({
      listingId,
      name,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to submit review",
    });
  }
});

export default router;