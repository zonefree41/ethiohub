import mongoose from "mongoose";

const HoursSchema = new mongoose.Schema(
  {
    mon: String,
    tue: String,
    wed: String,
    thu: String,
    fri: String,
    sat: String,
    sun: String,
  },
  { _id: false }
);

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    description_en: { type: String, default: "" },
    description_am: { type: String, default: "" },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    subcategory: {
  type: String,
  default: "",
  trim: true,
},

    businessHours: {
  type: String,
  trim: true,
},

approvalEmailSentAt: {
  type: Date,
  default: null,
},

    ownerId: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
  default: null,
},

availabilityStatus: {
  type: String,
  enum: ["available", "rented"],
  default: "available",
},
availableFrom: {
  type: Date,
},

monthlyRent: {
  type: Number,
  default: null,
},

bedrooms: {
  type: Number,
  default: null,
},

bathrooms: {
  type: Number,
  default: null,
},

squareFeet: {
  type: Number,
  default: null,
},

securityDeposit: {
  type: Number,
  default: null,
},

leaseTerm: {
  type: String,
  enum: ["Month-to-Month", "6 Months", "12 Months", "Flexible", ""],
  default: "",
},

parking: {
  type: Boolean,
  default: false,
},

petsAllowed: {
  type: Boolean,
  default: false,
},

utilitiesIncluded: {
  type: Boolean,
  default: false,
},

furnished: {
  type: Boolean,
  default: false,
},

propertyImages: [
  {
    type: String,
    trim: true,
  },
],

propertyVideoUrl: {
  type: String,
  default: "",
  trim: true,
},

transportVehicleTypes: {
  type: [String],
  default: [],
},

transportServiceArea: {
  type: String,
  default: "",
  trim: true,
},

transportAvailable24_7: {
  type: Boolean,
  default: false,
},

transportAirportService: {
  type: Boolean,
  default: false,
},

transportSameDayService: {
  type: Boolean,
  default: false,
},

transportLocalLongDistance: {
  type: String,
  enum: ["Local", "Long Distance", "Both", ""],
  default: "",
},

transportMaxLoad: {
  type: String,
  default: "",
  trim: true,
},

    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },

    address: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, default: "", trim: true },

    location: {
      lat: { type: Number },
      lng: { type: Number },
    },

    hours: { type: HoursSchema, default: {} },

    languages: { type: [String], default: ["en", "am"] },
    tags: { type: [String], default: [] },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },

    logoUrl: { type: String, default: "" },
imageUrl: { type: String, default: "" },

    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    paymentStatus: {
  type: String,
  enum: ["none", "trial", "unpaid", "active", "canceled", "failed"],
  default: "none",
},

trialStartedAt: {
  type: Date,
  default: null,
},

trialEndsAt: {
  type: Date,
  default: null,
},

trialReminderSentAt: {
  type: Date,
  default: null,
},

trialExpiredEmailSentAt: {
  type: Date,
  default: null,
},

hasUsedTrial: {
  type: Boolean,
  default: false,
},

    stripeSessionId: { type: String, default: "" },
    stripeCustomerId: { type: String, default: "" },
    stripeSubscriptionId: { type: String, default: "" },

    subscriptionCancelAt: {
  type: Date,
  default: null,
},

    clicks: {
  views: { type: Number, default: 0 },

  call: { type: Number, default: 0 },
  whatsapp: { type: Number, default: 0 },
  website: { type: Number, default: 0 },
  directions: { type: Number, default: 0 },
},

    submittedBy: {
      name: { type: String, default: "" },
      contact: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

ListingSchema.index({
  title: "text",
  description_en: "text",
  description_am: "text",
  city: "text",
  subcategory: "text",
});

export default mongoose.model("Listing", ListingSchema);