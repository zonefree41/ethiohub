import express from "express";
import mongoose from "mongoose";
import Review from "../models/Review.js";
import ReviewReport from "../models/ReviewReport.js";
import { sendEmail } from "../utils/sendEmail.js";
import {
  requireAdmin,
  requireRole,
} from "../middleware/auth.js";

const router = express.Router();

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

router.post("/:reviewId/report", async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason, details = "", action = "report" } = req.body;

    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({
        message: "Invalid review ID",
      });
    }

    const allowedReasons = [
      "abusive",
      "harassment",
      "hate",
      "spam",
      "fraud",
      "obscene",
      "other",
    ];

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        message: "Please select a valid report reason.",
      });
    }

    if (!["report", "block"].includes(action)) {
      return res.status(400).json({
        message: "Invalid moderation action.",
      });
    }

    const review = await Review.findById(reviewId);

    if (!review || !review.approved) {
      return res.status(404).json({
        message: "Review not found.",
      });
    }

    const report = await ReviewReport.create({
      reviewId: review._id,
      listingId: review.listingId,
      reason,
      details: String(details).trim().slice(0, 1000),
      action,
      status: "pending",
    });

    const notificationEmail = process.env.ADMIN_EMAIL;

    if (notificationEmail) {
      await sendEmail({
        to: notificationEmail,
        subject: `Review moderation report: ${reason}`,
        html: `
          <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
            <h2>HubEthio Review Moderation Report</h2>
            <p><strong>Action:</strong> ${escapeHtml(action)}</p>
            <p><strong>Reason:</strong> ${escapeHtml(reason)}</p>
            <p><strong>Review ID:</strong> ${review._id}</p>
            <p><strong>Listing ID:</strong> ${review.listingId}</p>
            <p><strong>Reviewer:</strong> ${escapeHtml(review.name)}</p>
            <p><strong>Review:</strong> ${escapeHtml(review.comment)}</p>
            ${
              report.details
                ? `<p><strong>Additional details:</strong> ${escapeHtml(report.details)}</p>`
                : ""
            }
            <p>Please review this report within 24 hours.</p>
          </div>
        `,
      });
    }

    res.status(201).json({
      message:
        action === "block"
          ? "Reviewer blocked from your view and report submitted."
          : "Report submitted successfully.",
      reportId: report._id,
    });
  } catch (err) {
    console.error("Failed to report review:", err);

    res.status(500).json({
      message: "Failed to submit report.",
    });
  }
});

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

router.get(
  "/admin/reports/pending",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin",
    "support_agent"
  ),
  async (_req, res) => {
    try {
      const reports = await ReviewReport.find({
        status: "pending",
      })
        .populate(
          "reviewId",
          "name rating comment approved createdAt"
        )
        .populate(
          "listingId",
          "title city state"
        )
        .sort({ createdAt: -1 });

      res.json(reports);
    } catch (err) {
      console.error(
        "Failed to load pending review reports:",
        err
      );

      res.status(500).json({
        message:
          "Failed to load pending review reports",
      });
    }
  }
);

router.patch(
  "/admin/reports/:reportId/status",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin",
    "support_agent"
  ),
  async (req, res) => {
    try {
      const { reportId } = req.params;
      const { status } = req.body;

      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({
          message: "Invalid report ID",
        });
      }

      if (!["resolved", "dismissed"].includes(status)) {
        return res.status(400).json({
          message: "Invalid report status.",
        });
      }

      const report = await ReviewReport.findByIdAndUpdate(
        reportId,
        {
          status,
          reviewedAt: new Date(),
          reviewedBy: req.admin.id,
        },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({
          message: "Review report not found.",
        });
      }

      res.json({
        message:
          status === "resolved"
            ? "Review report resolved."
            : "Review report dismissed.",
        report,
      });
    } catch (err) {
      console.error(
        "Failed to update review report:",
        err
      );

      res.status(500).json({
        message: "Failed to update review report.",
      });
    }
  }
);

router.delete(
  "/admin/reports/:reportId/review",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin"
  ),
  async (req, res) => {
    try {
      const { reportId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(reportId)) {
        return res.status(400).json({
          message: "Invalid report ID",
        });
      }

      const report = await ReviewReport.findById(reportId);

      if (!report) {
        return res.status(404).json({
          message: "Review report not found.",
        });
      }

      await Review.findByIdAndDelete(report.reviewId);

      report.status = "resolved";
      report.reviewedAt = new Date();
      report.reviewedBy = req.admin.id;
      await report.save();

      res.json({
        message:
          "Reported review removed and report resolved.",
      });
    } catch (err) {
      console.error(
        "Failed to remove reported review:",
        err
      );

      res.status(500).json({
        message:
          "Failed to remove reported review.",
      });
    }
  }
);

router.get(
  "/admin/pending",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin",
    "support_agent"
  ),
  async (_req, res) => {
    try {
      const reviews = await Review.find({
        approved: false,
      })
        .populate(
          "listingId",
          "title city state"
        )
        .sort({ createdAt: -1 });

      res.json(reviews);
    } catch (err) {
      console.error(
        "Failed to load pending reviews:",
        err
      );

      res.status(500).json({
        message:
          "Failed to load pending reviews",
      });
    }
  }
);

router.patch(
  "/admin/:reviewId/approve",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin"
  ),
  async (req, res) => {
    try {
      const { reviewId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          reviewId
        )
      ) {
        return res.status(400).json({
          message: "Invalid review ID",
        });
      }

      const review =
        await Review.findByIdAndUpdate(
          reviewId,
          { approved: true },
          { new: true }
        );

      if (!review) {
        return res.status(404).json({
          message: "Review not found",
        });
      }

      res.json({
        message:
          "Review approved successfully.",
        review,
      });
    } catch (err) {
      console.error(
        "Failed to approve review:",
        err
      );

      res.status(500).json({
        message:
          "Failed to approve review",
      });
    }
  }
);

router.delete(
  "/admin/:reviewId",
  requireAdmin,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const { reviewId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          reviewId
        )
      ) {
        return res.status(400).json({
          message: "Invalid review ID",
        });
      }

      const review =
        await Review.findByIdAndDelete(
          reviewId
        );

      if (!review) {
        return res.status(404).json({
          message: "Review not found",
        });
      }

      res.json({
        message:
          "Review deleted successfully.",
      });
    } catch (err) {
      console.error(
        "Failed to delete review:",
        err
      );

      res.status(500).json({
        message:
          "Failed to delete review",
      });
    }
  }
);

export default router;