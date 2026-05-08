import mongoose from "mongoose";

const HoursSchema = new mongoose.Schema(
  {
    mon: String, tue: String, wed: String, thu: String, fri: String, sat: String, sun: String
  },
  { _id: false }
);

const ListingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    description_en: { type: String, default: "" },
    description_am: { type: String, default: "" },

    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },

    phone: { type: String, required: true, trim: true },
    whatsapp: { type: String, default: "", trim: true },
    website: { type: String, default: "", trim: true },

    address: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    zip: { type: String, default: "", trim: true },

    location: {
      lat: { type: Number },
      lng: { type: Number }
    },

    hours: { type: HoursSchema, default: {} },

    languages: { type: [String], default: ["en", "am"] }, // e.g. ["am","en"]
    tags: { type: [String], default: [] },

    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    isFeatured: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },

    paymentStatus: { type: String, default: "none" },
stripeSessionId: { type: String, default: "" },
stripeCustomerId: { type: String, default: "" },
stripeSubscriptionId: { type: String, default: "" },

    clicks: {
  call: { type: Number, default: 0 },
  whatsapp: { type: Number, default: 0 },
  website: { type: Number, default: 0 },
  directions: { type: Number, default: 0 }
},

    submittedBy: {
      name: { type: String, default: "" },
      contact: { type: String, default: "" } // email or phone
    }
  },
  { timestamps: true }
);

ListingSchema.index({ title: "text", description_en: "text", description_am: "text", city: "text" });

export default mongoose.model("Listing", ListingSchema);
