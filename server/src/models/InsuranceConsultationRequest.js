import mongoose from "mongoose";

const InsuranceConsultationRequestSchema =
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
          "Life Insurance",
          "Disability Income Protection",
          "Family Protection",
          "Business Owner Protection",
          "Financial Planning",
          "Retirement / Long-Term Planning",
          "Other",
        ],
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
          "Client",
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

      clientAt: {
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

InsuranceConsultationRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

InsuranceConsultationRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "InsuranceConsultationRequest",
  InsuranceConsultationRequestSchema
);