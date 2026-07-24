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