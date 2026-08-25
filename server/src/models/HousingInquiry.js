import mongoose from "mongoose";

const HousingInquirySchema = new mongoose.Schema(
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

    desiredMoveInDate: {
      type: Date,
      required: true,
    },

    occupants: {
      type: Number,
      min: 1,
      default: 1,
    },

    monthlyBudget: {
  type: Number,
  min: 0,
  default: null,
},

bedroomsNeeded: {
  type: Number,
  min: 0,
  default: null,
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

    message: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1500,
    },

    status: {
      type: String,
      enum: [
  "New",
  "Contacted",
  "Viewing Scheduled",
  "Application",
  "Approved",
  "Move-In Scheduled",
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

    contactedAt: {
      type: Date,
      default: null,
    },

    viewingScheduledAt: {
  type: Date,
  default: null,
},

applicationAt: {
  type: Date,
  default: null,
},

moveInScheduledAt: {
  type: Date,
  default: null,
},

completedAt: {
  type: Date,
  default: null,
},

    approvedAt: {
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

HousingInquirySchema.index({
  ownerId: 1,
  createdAt: -1,
});

HousingInquirySchema.index({
  listingId: 1,
  desiredMoveInDate: 1,
});

export default mongoose.model(
  "HousingInquiry",
  HousingInquirySchema
);