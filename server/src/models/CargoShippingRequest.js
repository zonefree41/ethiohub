import mongoose from "mongoose";

const cargoShippingRequestSchema =
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
        enum: [
          "Air Cargo",
          "Sea Cargo",
          "Package Shipping",
          "Moving Services",
          "Commercial Freight",
          "Customs Assistance",
          "Other",
        ],
        default: "Other",
      },

      originCountry: {
        type: String,
        default: "United States",
        trim: true,
      },

      originCity: {
        type: String,
        default: "",
        trim: true,
      },

      originState: {
        type: String,
        default: "",
        trim: true,
      },

      destinationCity: {
        type: String,
        default: "",
        trim: true,
      },

      destinationCountry: {
        type: String,
        default: "Ethiopia",
        trim: true,
      },

      itemDescription: {
        type: String,
        required: true,
        trim: true,
      },

      packageCount: {
        type: Number,
        min: 1,
        default: 1,
      },

      estimatedWeight: {
        type: Number,
        min: 0,
        default: null,
      },

      weightUnit: {
        type: String,
        enum: ["lb", "kg"],
        default: "lb",
      },

      dimensions: {
        type: String,
        default: "",
        trim: true,
      },

      pickupRequired: {
        type: Boolean,
        default: false,
      },

      desiredShippingDate: {
        type: String,
        default: "",
      },

      customsAssistanceNeeded: {
        type: Boolean,
        default: false,
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

      status: {
        type: String,
        enum: [
          "New",
          "Reviewing",
          "Quoted",
          "Accepted",
          "Cargo Received",
          "In Transit",
          "Arrived",
          "Completed",
          "Declined",
          "Closed",
        ],
        default: "New",
        index: true,
      },

      quoteAmount: {
        type: Number,
        min: 0,
        default: null,
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

      customerRespondedAt: {
        type: Date,
        default: null,
      },

      reviewingAt: {
        type: Date,
        default: null,
      },

      quotedAt: {
        type: Date,
        default: null,
      },

      acceptedAt: {
        type: Date,
        default: null,
      },

      cargoReceivedAt: {
        type: Date,
        default: null,
      },

      inTransitAt: {
        type: Date,
        default: null,
      },

      arrivedAt: {
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

      ownerNotes: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );

cargoShippingRequestSchema.index({
  ownerId: 1,
  createdAt: -1,
});

cargoShippingRequestSchema.index({
  listingId: 1,
  createdAt: -1,
});

const CargoShippingRequest =
  mongoose.models.CargoShippingRequest ||
  mongoose.model(
    "CargoShippingRequest",
    cargoShippingRequestSchema
  );

export default CargoShippingRequest;