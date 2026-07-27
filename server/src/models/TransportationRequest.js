import mongoose from "mongoose";

const transportationRequestSchema = new mongoose.Schema(
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
      maxlength: 120,
    },

    customerEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: "",
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    pickupAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    deliveryAddress: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    requestedDate: {
      type: Date,
      required: true,
    },

    requestedTime: {
      type: String,
      trim: true,
      maxlength: 50,
      default: "",
    },

    cargoDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },

    cargoPhotos: {
      type: [String],
      default: [],
      validate: {
        validator(value) {
          return value.length <= 5;
        },
        message: "A maximum of 5 cargo photos is allowed.",
      },
    },

    serviceType: {
      type: String,
      enum: [
        "Furniture Delivery",
        "Package Delivery",
        "Moving Service",
        "Airport Transportation",
        "Freight Delivery",
        "Other",
      ],
      default: "Other",
    },

  status: {
  type: String,
  enum: [
    "New",
    "Quoted",
    "Accepted",
    "Declined",
    "In Progress",
    "Completed",
    "Cancelled",
  ],
  default: "New",
  index: true,
},

quoteAmount: {
  type: Number,
  min: 0,
  default: null,
},

estimatedArrival: {
  type: String,
  trim: true,
  maxlength: 200,
  default: "",
},

ownerNotes: {
  type: String,
  trim: true,
  maxlength: 2000,
  default: "",
},

quotedAt: {
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

cancelledAt: {
  type: Date,
  default: null,
},

driverName: {
  type: String,
  trim: true,
  default: "",
},

driverPhone: {
  type: String,
  trim: true,
  default: "",
},

vehicleDescription: {
  type: String,
  trim: true,
  default: "",
},

licensePlate: {
  type: String,
  trim: true,
  default: "",
},

driverAssignedAt: {
  type: Date,
  default: null,
},

quoteAccessToken: {
  type: String,
  default: "",
  index: true,
},

quoteAccessTokenExpiresAt: {
  type: Date,
  default: null,
},

customerQuoteEmailSentAt: {
  type: Date,
  default: null,
},

customerRespondedAt: {
  type: Date,
  default: null,
},

adminNotes: {
  type: String,
  trim: true,
  maxlength: 4000,
  default: "",
},

adminCancellationReason: {
  type: String,
  trim: true,
  maxlength: 1000,
  default: "",
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

    ownerEmailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

transportationRequestSchema.index({
  ownerId: 1,
  status: 1,
  createdAt: -1,
});

transportationRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

export default mongoose.model(
  "TransportationRequest",
  transportationRequestSchema
);