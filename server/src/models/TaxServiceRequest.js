import mongoose from "mongoose";

const TaxServiceRequestSchema =
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

      serviceType: {
        type: String,
        required: true,
        enum: [
          "Individual Tax Return",
          "Business Tax Return",
          "Tax Consultation",
          "Bookkeeping / Accounting",
          "Tax Planning",
          "Prior-Year / Amended Return",
          "Other",
        ],
      },

      preferredAppointmentDate: {
        type: Date,
        default: null,
      },

      preferredAppointmentTime: {
        type: String,
        default: "",
        trim: true,
      },

      preferredContactMethod: {
        type: String,
        enum: [
          "Phone",
          "Email",
          "WhatsApp",
          "Either",
        ],
        default: "Either",
      },

      message: {
        type: String,
        default: "",
        trim: true,
        maxlength: 2000,
      },

      status: {
        type: String,
        enum: [
          "New",
          "Contacted",
          "Appointment Scheduled",
          "In Preparation",
          "Completed",
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

      appointmentScheduledAt: {
        type: Date,
        default: null,
      },

      scheduledAppointmentDate: {
        type: Date,
        default: null,
      },

      scheduledAppointmentTime: {
        type: String,
        default: "",
        trim: true,
      },

      preparationStartedAt: {
        type: Date,
        default: null,
      },

      completedAt: {
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

TaxServiceRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

TaxServiceRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "TaxServiceRequest",
  TaxServiceRequestSchema
);