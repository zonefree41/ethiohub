import mongoose from "mongoose";

const HousingInquirySchema = new mongoose.Schema(
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

    desiredMoveInDate: {
      type: Date,
      required: true,
    },

    occupants: {
      type: Number,
      min: 1,
      default: 1,
    },

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1500,
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Approved",
        "Declined",
        "Closed",
      ],
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

    approvedAt: {
      type: Date,
      default: null,
    },

    declinedAt: {
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

HousingInquirySchema.index({
  ownerId: 1,
  createdAt: -1,
});

HousingInquirySchema.index({
  listingId: 1,
  desiredMoveInDate: 1,
});

export default mongoose.model(
  "HousingInquiry",
  HousingInquirySchema
);