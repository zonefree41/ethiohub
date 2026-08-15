import mongoose from "mongoose";

const notaryServiceRequestSchema = new mongoose.Schema(
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
      trim: true,
    },

    documentType: {
      type: String,
      default: "",
      trim: true,
    },

    serviceLocation: {
      type: String,
      enum: ["Office", "Mobile Notary", "Either"],
      default: "Either",
    },

    preferredAppointmentDate: {
      type: String,
      default: "",
    },

    preferredAppointmentTime: {
      type: String,
      default: "",
    },

    preferredContactMethod: {
      type: String,
      enum: ["Either", "Phone", "Email", "WhatsApp"],
      default: "Either",
    },

    message: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "New",
        "Contacted",
        "Appointment Scheduled",
        "In Progress",
        "Completed",
        "Declined",
        "Closed",
      ],
      default: "New",
      index: true,
    },

    scheduledAppointmentDate: {
      type: String,
      default: "",
    },

    scheduledAppointmentTime: {
      type: String,
      default: "",
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

inProgressAt: {
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

notaryServiceRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

notaryServiceRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

const NotaryServiceRequest =
  mongoose.models.NotaryServiceRequest ||
  mongoose.model(
    "NotaryServiceRequest",
    notaryServiceRequestSchema
  );

export default NotaryServiceRequest;