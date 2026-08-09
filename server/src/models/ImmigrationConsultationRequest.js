import mongoose from "mongoose";

const ImmigrationConsultationRequestSchema =
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

      caseType: {
        type: String,
        required: true,
        trim: true,
      },

      preferredConsultationDate: {
        type: Date,
        default: null,
      },

      preferredConsultationTime: {
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
          "Consultation Scheduled",
          "Retained",
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

      consultationScheduledAt: {
        type: Date,
        default: null,
      },

      scheduledConsultationDate: {
  type: Date,
  default: null,
},

scheduledConsultationTime: {
  type: String,
  default: "",
  trim: true,
},

      retainedAt: {
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

ImmigrationConsultationRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

ImmigrationConsultationRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "ImmigrationConsultationRequest",
  ImmigrationConsultationRequestSchema
);