import mongoose from "mongoose";

const churchCommunityInquirySchema = new mongoose.Schema(
  {
    listingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    customerName: {
      type: String,
      required: true,
      trim: true,
    },

    customerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    inquiryType: {
      type: String,
      required: true,
      trim: true,
    },

    preferredContactMethod: {
      type: String,
      enum: ["Phone", "Email", "Either"],
      default: "Either",
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["New", "Contacted", "Resolved", "Closed"],
      default: "New",
      index: true,
    },

    ownerNotes: {
      type: String,
      default: "",
      trim: true,
    },

    contactedAt: {
      type: Date,
      default: null,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

churchCommunityInquirySchema.index({
  ownerId: 1,
  createdAt: -1,
});

churchCommunityInquirySchema.index({
  listingId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "ChurchCommunityInquiry",
  churchCommunityInquirySchema
);
