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
    transportVerification: {
  driverFullName: {
    type: String,
    trim: true,
    default: "",
  },

  rejectionReason: {
    type: String,
    trim: true,
    default: "",
  },


  driverLicenseNumber: {
    type: String,
    trim: true,
    default: "",
  },

  driverLicenseState: {
    type: String,
    trim: true,
    default: "",
  },

  driverLicenseExpirationDate: {
    type: Date,
    default: null,
  },

  driverLicenseFrontUrl: {
    type: String,
    trim: true,
    default: "",
  },

  driverLicenseBackUrl: {
    type: String,
    trim: true,
    default: "",
  },

  vehicleMake: {
    type: String,
    trim: true,
    default: "",
  },

  vehicleModel: {
    type: String,
    trim: true,
    default: "",
  },

  vehicleYear: {
    type: Number,
    default: null,
  },

  vehicleVin: {
    type: String,
    trim: true,
    default: "",
  },

  vehicleLicensePlate: {
    type: String,
    trim: true,
    default: "",
  },

  vehicleRegistrationExpirationDate: {
    type: Date,
    default: null,
  },

  vehicleRegistrationUrl: {
    type: String,
    trim: true,
    default: "",
  },

  insuranceCompany: {
    type: String,
    trim: true,
    default: "",
  },

  insurancePolicyNumber: {
    type: String,
    trim: true,
    default: "",
  },

  insuranceCoverageType: {
    type: String,
    enum: ["commercial_auto", "business_auto", "personal", ""],
    default: "",
  },

  commercialDeliveryCovered: {
    type: Boolean,
    default: false,
  },

  insuranceExpirationDate: {
    type: Date,
    default: null,
  },

  insuranceDocumentUrl: {
    type: String,
    trim: true,
    default: "",
  },

  hasCargoInsurance: {
    type: Boolean,
    default: false,
  },

  cargoCoverageAmount: {
    type: Number,
    default: null,
  },

  cargoInsuranceDocumentUrl: {
    type: String,
    trim: true,
    default: "",
  },

  usdotStatus: {
    type: String,
    enum: ["yes", "no", "not_required", "unsure", ""],
    default: "",
  },

  usdotNumber: {
    type: String,
    trim: true,
    default: "",
  },

  mcStatus: {
    type: String,
    enum: ["yes", "no", "not_required", "unsure", ""],
    default: "",
  },

  mcNumber: {
    type: String,
    trim: true,
    default: "",
  },

  operatingAuthority: {
  type: String,
  enum: [
    "Common Carrier",
    "Contract Carrier",
    "Broker",
    "Freight Forwarder",
    "Private Carrier",
    "Not Applicable",
    "",
  ],
  default: "",
},

operatingStatus: {
  type: String,
  enum: [
    "Active",
    "Inactive",
    "Pending",
    "",
  ],
  default: "",
},

ownerCertification: {
  type: Boolean,
  default: false,
},

verificationStatus: {
  type: String,
  enum: [
    "Not Submitted",
    "Pending Review",
    "Approved",
    "Rejected",
  ],
  default: "Not Submitted",
},

  identityVerified: {
    type: Boolean,
    default: false,
  },

  driverVerified: {
    type: Boolean,
    default: false,
  },

  vehicleVerified: {
    type: Boolean,
    default: false,
  },

  insuranceVerified: {
    type: Boolean,
    default: false,
  },

  cargoInsuranceVerified: {
    type: Boolean,
    default: false,
  },

  usdotVerified: {
    type: Boolean,
    default: false,
  },

  mcVerified: {
    type: Boolean,
    default: false,
  },

  verificationSubmittedAt: {
  type: Date,
  default: null,
},
},

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

transportCargoLength: {
  type: String,
  default: "",
  trim: true,
},

transportCargoWidth: {
  type: String,
  default: "",
  trim: true,
},

transportCargoHeight: {
  type: String,
  default: "",
  trim: true,
},

transportPalletCapacity: {
  type: String,
  default: "",
  trim: true,
},

transportResidentialDelivery: {
  type: Boolean,
  default: false,
},

transportCommercialDelivery: {
  type: Boolean,
  default: false,
},

transportWarehousePickup: {
  type: Boolean,
  default: false,
},

transportWarehouseDelivery: {
  type: Boolean,
  default: false,
},

transportDockHighDelivery: {
  type: Boolean,
  default: false,
},

transportInsideDelivery: {
  type: Boolean,
  default: false,
},

transportWhiteGloveService: {
  type: Boolean,
  default: false,
},

transportRefrigeratedTransport: {
  type: Boolean,
  default: false,
},

transportLiftgateAvailable: {
  type: Boolean,
  default: false,
},

// Beauty & Wellness fields
beautyServices: {
  type: [String],
  default: [],
},

beautyWalkInsWelcome: {
  type: Boolean,
  default: false,
},

beautyAppointmentRequired: {
  type: Boolean,
  default: false,
},

beautySameDayAppointment: {
  type: Boolean,
  default: false,
},

beautyWeekendAvailability: {
  type: Boolean,
  default: false,
},

beautyServes: {
  type: [String],
  default: [],
},

beautyStartingPrice: {
  type: String,
  default: "",
},

beautyLanguages: {
  type: [String],
  default: [],
},

beautyInstagram: {
  type: String,
  default: "",
},

beautyFacebook: {
  type: String,
  default: "",
},

beautyTikTok: {
  type: String,
  default: "",
},

beautyBookingUrl: {
  type: String,
  default: "",
  trim: true,
},

beautyPhotos: {
  type: [String],
  default: [],
},

beautyVideoUrl: {
  type: String,
  default: "",
},

beautyBeforeAfter: {
  type: [
    {
      title: {
        type: String,
        default: "",
      },
      beforeUrl: {
        type: String,
        default: "",
      },
      afterUrl: {
        type: String,
        default: "",
      },
    },
  ],
  default: [],
},

promotions: {
  type: [
    {
      title: {
        type: String,
        default: "",
        trim: true,
      },
      description: {
        type: String,
        default: "",
        trim: true,
      },
      discountType: {
        type: String,
        enum: ["percent", "fixed", "free", "custom", ""],
        default: "",
      },
      discountValue: {
        type: String,
        default: "",
        trim: true,
      },
      validUntil: {
        type: Date,
        default: null,
      },
      isActive: {
        type: Boolean,
        default: true,
      },
    },
  ],
  default: [],
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

trial14DayReminderSentAt: {
  type: Date,
  default: null,
},

trial7DayReminderSentAt: {
  type: Date,
  default: null,
},

trial1DayReminderSentAt: {
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
      type: {
        name: { type: String, default: "" },
        contact: { type: String, default: "" },
      },
      default: () => ({}),
    }
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