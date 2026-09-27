import mongoose from "mongoose";

const reviewReportSchema = new mongoose.Schema(
  {
    reviewId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Review",
      required: true,
      index: true,
    },

    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    reason: {
      type: String,
      enum: [
        "abusive",
        "harassment",
        "hate",
        "spam",
        "fraud",
        "obscene",
        "other",
      ],
      required: true,
    },

    details: {
      type: String,
      trim: true,
      default: "",
    },

    action: {
      type: String,
      enum: ["report", "block"],
      default: "report",
    },

    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
      index: true,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("ReviewReport", reviewReportSchema);
