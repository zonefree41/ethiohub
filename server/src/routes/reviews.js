import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";

const router = express.Router();

router.get("/:listingId", async (req, res) => {
  try {
    const { listingId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const reviews = await Review.find({
      listingId,
      approved: true,
    }).sort({ createdAt: -1 });

    const totalReviews = reviews.length;

    const averageRating =
      totalReviews > 0
        ? (
            reviews.reduce((sum, review) => sum + review.rating, 0) /
            totalReviews
          ).toFixed(1)
        : 0;

    res.json({
      reviews,
      totalReviews,
      averageRating,
    });
  } catch (err) {
    console.error("Failed to load reviews:", err);
    res.status(500).json({ message: "Failed to load reviews" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { listingId, name, rating, comment } = req.body;

    if (!listingId || !name || !rating || !comment) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({ message: "Invalid listing ID" });
    }

    const numericRating = Number(rating);

    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ message: "Rating must be between 1 and 5" });
    }

    const review = await Review.create({
      listingId,
      name,
      rating: numericRating,
      comment,
      approved: false,
    });

    res.status(201).json({
      message: "Review submitted successfully. Waiting for approval.",
      review,
    });
  } catch (err) {
    console.error("Failed to submit review:", err);
    res.status(500).json({ message: "Failed to submit review" });
  }
});

router.get("/admin/pending", async (_req, res) => {
  try {
    const reviews = await Review.find({ approved: false })
      .populate("listingId", "title city state")
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error("Failed to load pending reviews:", err);
    res.status(500).json({ message: "Failed to load pending reviews" });
  }
});

router.patch("/admin/:reviewId/approve", async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { approved: true },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({
      message: "Review approved successfully.",
      review,
    });
  } catch (err) {
    console.error("Failed to approve review:", err);
    res.status(500).json({ message: "Failed to approve review" });
  }
});

router.delete("/admin/:reviewId", async (req, res) => {
  try {
    const { reviewId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ message: "Invalid review ID" });
    }

    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({ message: "Review not found" });
    }

    res.json({ message: "Review deleted successfully." });
  } catch (err) {
    console.error("Failed to delete review:", err);
    res.status(500).json({ message: "Failed to delete review" });
  }
});

export default router;