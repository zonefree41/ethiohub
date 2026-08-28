import mongoose from "mongoose";

const VehicleInquirySchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleListing",
      required: true,
      index: true,
    },

    sellerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    buyerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    buyerPhone: {
      type: String,
      default: "",
      trim: true,
      maxlength: 40,
    },

    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    status: {
      type: String,
      enum: ["New", "Contacted", "Closed"],
      default: "New",
      index: true,
    },

    contactedAt: {
      type: Date,
      default: null,
    },

    closedAt: {
      type: Date,
      default: null,
    },

    ownerNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 2000,
    },
  },
  {
    timestamps: true,
  }
);

VehicleInquirySchema.index({
  sellerUserId: 1,
  status: 1,
  createdAt: -1,
});

VehicleInquirySchema.index({
  vehicleId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "VehicleInquiry",
  VehicleInquirySchema
);