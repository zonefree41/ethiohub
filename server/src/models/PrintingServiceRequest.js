import mongoose from "mongoose";

const printingServiceRequestSchema =
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
        trim: true,
      },

      productType: {
        type: String,
        default: "",
        trim: true,
      },

      quantity: {
        type: Number,
        default: 1,
        min: 1,
      },

      sizeSpecifications: {
        type: String,
        default: "",
        trim: true,
      },

      colorOption: {
        type: String,
        default: "",
        trim: true,
      },

      finishingOptions: {
        type: String,
        default: "",
        trim: true,
      },

      neededByDate: {
        type: String,
        default: "",
      },

      fulfillmentMethod: {
        type: String,
        enum: [
          "Pickup",
          "Local Delivery",
          "Shipping",
          "Either",
        ],
        default: "Either",
      },

      preferredContactMethod: {
        type: String,
        enum: [
          "Either",
          "Phone",
          "Email",
          "WhatsApp",
        ],
        default: "Either",
      },

      message: {
        type: String,
        default: "",
        trim: true,
      },

      quoteAmount: {
        type: Number,
        default: null,
        min: 0,
      },

      quoteNotes: {
        type: String,
        default: "",
        trim: true,
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

      status: {
        type: String,
        enum: [
          "New",
          "Quoted",
          "Approved",
          "In Production",
          "Ready",
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

      quotedAt: {
        type: Date,
        default: null,
      },

      approvedAt: {
        type: Date,
        default: null,
      },

      productionStartedAt: {
        type: Date,
        default: null,
      },

      readyAt: {
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

printingServiceRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

printingServiceRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

const PrintingServiceRequest =
  mongoose.models.PrintingServiceRequest ||
  mongoose.model(
    "PrintingServiceRequest",
    printingServiceRequestSchema
  );

export default PrintingServiceRequest;