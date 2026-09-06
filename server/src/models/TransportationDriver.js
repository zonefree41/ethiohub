import mongoose from "mongoose";

const transportationDriverSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    businessListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Listing",
      required: true,
      index: true,
    },

    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
    },

    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    status: {
      type: String,
      enum: ["pending", "active", "suspended", "inactive"],
      default: "pending",
      index: true,
    },

    verificationStatus: {
      type: String,
      enum: ["not_submitted", "pending", "approved", "rejected"],
      default: "not_submitted",
      index: true,
    },

    availabilityStatus: {
      type: String,
      enum: ["offline", "available", "busy"],
      default: "offline",
      index: true,
    },

    serviceTypes: {
      type: [String],
      enum: [
        "Furniture Delivery",
        "Package Delivery",
        "Moving Service",
        "Airport Transportation",
        "Freight Delivery",
        "Other",
      ],
      default: [],
    },
  },
  { timestamps: true }
);

transportationDriverSchema.index({
  businessListingId: 1,
  status: 1,
  verificationStatus: 1,
});

transportationDriverSchema.index({
  ownerId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "TransportationDriver",
  transportationDriverSchema
);
