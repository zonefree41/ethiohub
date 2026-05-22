import mongoose from "mongoose";

const businessRequestSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
      uppercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    suggestedByName: {
      type: String,
      trim: true,
    },
    suggestedByContact: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "added", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("BusinessRequest", businessRequestSchema);