import mongoose from "mongoose";

const translatorServiceRequestSchema = new mongoose.Schema(
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

    serviceType: {
      type: String,
      required: true,
      enum: [
        "Document Translation",
        "In-Person Interpretation",
        "Phone Interpretation",
        "Video Interpretation",
        "Other",
      ],
    },

    languageFrom: {
      type: String,
      required: true,
      trim: true,
    },

    languageTo: {
      type: String,
      required: true,
      trim: true,
    },

    requestDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 3000,
    },

    preferredDate: {
      type: Date,
      required: true,
    },

    preferredTime: {
      type: String,
      required: true,
      trim: true,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: [
        "New",
        "Confirmed",
        "Declined",
        "Completed",
        "Cancelled",
      ],
      default: "New",
      index: true,
    },

    ownerNotes: {
      type: String,
      default: "",
      trim: true,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    declinedAt: {
      type: Date,
      default: null,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

translatorServiceRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

translatorServiceRequestSchema.index({
  listingId: 1,
  preferredDate: 1,
});

export default mongoose.model(
  "TranslatorServiceRequest",
  translatorServiceRequestSchema
);
