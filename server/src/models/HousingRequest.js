import mongoose from "mongoose";

const HousingRequestSchema = new mongoose.Schema(
  {
    requesterName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    housingTypes: {
      type: [String],
      required: true,
      enum: [
        "Room",
        "Basement",
        "Apartment",
        "House",
        "Shared Housing",
      ],
    },

    preferredCities: {
      type: [String],
      default: [],
    },

    preferredState: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },

    moveInDate: {
      type: Date,
      required: true,
    },

    budgetMin: {
      type: Number,
      required: true,
      min: 0,
    },

    budgetMax: {
      type: Number,
      required: true,
      min: 0,
    },

    leasePreference: {
      type: String,
      enum: [
        "Month-to-Month",
        "Short-Term",
        "6 Months",
        "12 Months",
        "Flexible",
      ],
      default: "Flexible",
    },

    aboutMe: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1500,
    },

    smokingStatus: {
      type: String,
      enum: ["Non-Smoker", "Smoker", "Prefer not to say"],
      default: "Prefer not to say",
    },

    hasPets: {
      type: Boolean,
      default: false,
    },

    petFriendlyRequired: {
  type: Boolean,
  default: false,
},

openToNearbyAreas: {
  type: Boolean,
  default: false,
},

bedroomsNeeded: {
  type: Number,
  min: 0,
  default: null,
},

urgentHousingNeeded: {
  type: Boolean,
  default: false,
},

securityDepositAssistanceNeeded: {
  type: Boolean,
  default: false,
},

movingAssistanceNeeded: {
  type: Boolean,
  default: false,
},

    needsParking: {
      type: Boolean,
      default: false,
    },

    utilitiesPreferred: {
      type: Boolean,
      default: false,
    },

    furnishedPreferred: {
      type: Boolean,
      default: false,
    },

    contactPreference: {
      type: String,
      enum: ["Phone", "Email", "Either"],
      default: "Either",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "closed"],
      default: "pending",
    },

    isPublic: {
      type: Boolean,
      default: false,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },

    assistanceStatus: {
  type: String,
  enum: [
    "New",
    "Reviewing",
    "Matched",
    "Referred",
    "Closed",
  ],
  default: "New",
  index: true,
},

matchedListingIds: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
  },
],

adminAssistanceNotes: {
  type: String,
  default: "",
  trim: true,
},

reviewingAt: {
  type: Date,
  default: null,
},

matchedAt: {
  type: Date,
  default: null,
},

referredAt: {
  type: Date,
  default: null,
},

assistanceClosedAt: {
  type: Date,
  default: null,
},
  },
  {
    timestamps: true,
  }
);

HousingRequestSchema.index({
  preferredState: 1,
  status: 1,
  moveInDate: 1,
});

export default mongoose.model("HousingRequest", HousingRequestSchema);