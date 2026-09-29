import mongoose from "mongoose";

const restaurantMenuItemSchema = new mongoose.Schema(
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

    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80,
    },

    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },

    description: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    // Legacy primary photo kept for backward compatibility.
    imageUrl: {
      type: String,
      default: "",
      trim: true,
    },

    // Restaurant menu items can have up to 5 photos.
    imageUrls: {
      type: [
        {
          type: String,
          trim: true,
        },
      ],
      default: [],
      validate: {
        validator: (urls) => urls.length <= 5,
        message: "A menu item can have up to 5 photos.",
      },
    },

    isAvailable: {
      type: Boolean,
      default: true,
      index: true,
    },

    dietaryTags: {
      type: [
        {
          type: String,
          enum: [
            "Vegetarian",
            "Vegan",
            "Gluten-Free",
            "Halal",
          ],
        },
      ],
      default: [],
    },

    spicyLevel: {
      type: String,
      enum: ["None", "Mild", "Medium", "Hot", "Extra Hot"],
      default: "None",
    },

    displayOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

restaurantMenuItemSchema.index({
  listingId: 1,
  category: 1,
  displayOrder: 1,
  createdAt: 1,
});

restaurantMenuItemSchema.index({
  ownerId: 1,
  listingId: 1,
});

export default mongoose.model(
  "RestaurantMenuItem",
  restaurantMenuItemSchema
);
