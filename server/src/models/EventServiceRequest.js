import mongoose from "mongoose";

const eventServiceRequestSchema = new mongoose.Schema(
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
  default: null,
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

    eventType: {
      type: String,
      required: true,
      enum: [
        "Wedding",
        "Birthday",
        "Private Party",
        "Corporate Event",
        "Networking Event",
        "Graduation",
        "Religious / Community Event",
        "Other",
      ],
    },

    eventDate: {
      type: Date,
      required: true,
    },

    startTime: {
      type: String,
      trim: true,
      default: "",
    },

    venue: {
      type: String,
      trim: true,
      default: "",
    },

    city: {
      type: String,
      trim: true,
      default: "",
    },

    state: {
      type: String,
      trim: true,
      default: "",
    },

    guestCount: {
      type: Number,
      min: 1,
      default: null,
    },

    servicesNeeded: {
      type: [String],
      default: [],
    },

    budget: {
      type: String,
      trim: true,
      default: "",
    },

    additionalDetails: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Consultation Scheduled",
        "Proposal Sent",
        "Booked",
        "Event Completed",
        "Declined",
        "Closed",
      ],
      default: "New",
      index: true,
    },

    consultationDate: {
      type: Date,
      default: null,
    },

    proposalAmount: {
      type: Number,
      min: 0,
      default: null,
    },

    ownerNotes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

eventServiceRequestSchema.index({ ownerId: 1, createdAt: -1 });
eventServiceRequestSchema.index({ listingId: 1, createdAt: -1 });

export default mongoose.model(
  "EventServiceRequest",
  eventServiceRequestSchema
);
