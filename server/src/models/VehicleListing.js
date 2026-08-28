import mongoose from "mongoose";

const VehicleListingSchema = new mongoose.Schema(
  {
    sellerUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    sellerType: {
      type: String,
      enum: ["private", "dealer"],
      default: "private",
    },

    sellerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    sellerEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },

    sellerPhone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 40,
    },

    year: {
      type: Number,
      required: true,
      min: 1900,
      max: 2100,
    },

    make: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    model: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    trim: {
      type: String,
      default: "",
      trim: true,
      maxlength: 80,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    mileage: {
      type: Number,
      required: true,
      min: 0,
    },

    vin: {
      type: String,
      default: "",
      trim: true,
      uppercase: true,
      maxlength: 17,
    },

    exteriorColor: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    interiorColor: {
      type: String,
      default: "",
      trim: true,
      maxlength: 50,
    },

    transmission: {
      type: String,
      enum: ["Automatic", "Manual", "Other", ""],
      default: "",
    },

    drivetrain: {
      type: String,
      enum: ["FWD", "RWD", "AWD", "4WD", "Other", ""],
      default: "",
    },

    fuelType: {
      type: String,
      enum: [
        "Gasoline",
        "Diesel",
        "Hybrid",
        "Plug-in Hybrid",
        "Electric",
        "Other",
        "",
      ],
      default: "",
    },

    titleStatus: {
      type: String,
      enum: [
        "Clean",
        "Rebuilt",
        "Salvage",
        "Lien",
        "Other",
        "",
      ],
      default: "",
    },

    condition: {
      type: String,
      enum: [
        "Excellent",
        "Good",
        "Fair",
        "Needs Work",
        "",
      ],
      default: "",
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },

    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },

    photos: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "draft",
        "payment_pending",
        "pending_review",
        "approved",
        "rejected",
        "sold",
        "expired",
      ],
      default: "payment_pending",
      index: true,
    },

    paymentStatus: {
      type: String,
      enum: [
        "unpaid",
        "paid",
        "failed",
        "refunded",
      ],
      default: "unpaid",
      index: true,
    },

    listingFee: {
      type: Number,
      default: 9.99,
    },

    stripeSessionId: {
      type: String,
      default: "",
      index: true,
    },

    stripePaymentIntentId: {
      type: String,
      default: "",
    },

    paidAt: {
      type: Date,
      default: null,
    },

    paymentConfirmationEmailSentAt: {
  type: Date,
  default: null,
},

renewalCount: {
  type: Number,
  default: 0,
},

lastRenewedAt: {
  type: Date,
  default: null,
},

renewalStripeSessionId: {
  type: String,
  default: "",
  index: true,
},

renewalStripePaymentIntentId: {
  type: String,
  default: "",
},

renewalConfirmationEmailSentAt: {
  type: Date,
  default: null,
},

    approvedAt: {
      type: Date,
      default: null,
    },

    rejectedAt: {
      type: Date,
      default: null,
    },

    rejectionReason: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    soldAt: {
      type: Date,
      default: null,
    },

    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },

    isFeatured: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

VehicleListingSchema.index({
  make: "text",
  model: "text",
  trim: "text",
  city: "text",
  state: "text",
});

export default mongoose.model(
  "VehicleListing",
  VehicleListingSchema
);