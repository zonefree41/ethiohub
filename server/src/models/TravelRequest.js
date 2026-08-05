import mongoose from "mongoose";

const travelRequestSchema = new mongoose.Schema(
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
      trim: true,
      lowercase: true,
      default: "",
    },

    customerPhone: {
      type: String,
      required: true,
      trim: true,
    },

    tripType: {
      type: String,
      enum: ["One Way", "Round Trip"],
      default: "Round Trip",
    },

    departureCity: {
      type: String,
      required: true,
      trim: true,
    },

    destinationCity: {
      type: String,
      required: true,
      trim: true,
    },

    departureDate: {
      type: Date,
      required: true,
    },

    returnDate: {
      type: Date,
      default: null,
    },

    adults: {
      type: Number,
      default: 1,
    },

    children: {
      type: Number,
      default: 0,
    },

    infants: {
      type: Number,
      default: 0,
    },

    cabinClass: {
      type: String,
      enum: [
        "Economy",
        "Premium Economy",
        "Business",
        "First",
      ],
      default: "Economy",
    },

    directFlightPreferred: {
      type: Boolean,
      default: false,
    },

    flexibleDates: {
      type: Boolean,
      default: false,
    },

    hotelNeeded: {
      type: Boolean,
      default: false,
    },

    visaAssistance: {
      type: Boolean,
      default: false,
    },

    travelInsurance: {
      type: Boolean,
      default: false,
    },

    budget: {
      type: Number,
      default: null,
    },

    notes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 3000,
    },

    status: {
  type: String,
  enum: [
    "New",
    "Quoted",
    "Accepted",
    "Declined",
    "Booked",
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

airline: {
  type: String,
  trim: true,
  maxlength: 160,
  default: "",
},

flightItinerary: {
  type: String,
  trim: true,
  maxlength: 4000,
  default: "",
},

stops: {
  type: String,
  trim: true,
  maxlength: 200,
  default: "",
},

baggageAllowance: {
  type: String,
  trim: true,
  maxlength: 500,
  default: "",
},

quoteExpiresAt: {
  type: Date,
  default: null,
},

ownerNotes: {
  type: String,
  trim: true,
  maxlength: 3000,
  default: "",
},

quotedAt: {
  type: Date,
  default: null,
},

bookedAt: {
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
  {
    timestamps: true,
  }
);

export default mongoose.model("TravelRequest", travelRequestSchema);