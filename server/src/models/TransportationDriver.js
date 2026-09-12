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

    passwordHash: {
      type: String,
      select: false,
      default: "",
    },

    driverAccountStatus: {
      type: String,
      enum: ["not_activated", "active", "disabled"],
      default: "not_activated",
      index: true,
    },

    activationTokenHash: {
      type: String,
      select: false,
      default: "",
    },

    activationExpires: {
      type: Date,
      select: false,
      default: null,
    },

    passwordResetTokenHash: {
      type: String,
      select: false,
      default: "",
    },

    passwordResetExpires: {
      type: Date,
      select: false,
      default: null,
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
    lastAdminUpdatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
    },
    lastAdminUpdatedAt: {
      type: Date,
      default: null,
    },
    adminAuditLog: {
      type: [
        {
          action: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
          },
          previousStatus: {
            type: String,
            default: "",
          },
          newStatus: {
            type: String,
            default: "",
          },
          note: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
          },
          adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdminUser",
            required: true,
          },
          adminEmail: {
            type: String,
            trim: true,
            lowercase: true,
            default: "",
          },
          createdAt: {
            type: Date,
            default: Date.now,
          },
        },
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
