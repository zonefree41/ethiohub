import mongoose from "mongoose";

const beautyAppointmentRequestSchema =
  new mongoose.Schema(
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

      service: {
        type: String,
        required: true,
        trim: true,
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

beautyAppointmentRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

beautyAppointmentRequestSchema.index({
  listingId: 1,
  preferredDate: 1,
});

export default mongoose.model(
  "BeautyAppointmentRequest",
  beautyAppointmentRequestSchema
);