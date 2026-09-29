import express from "express";
import mongoose from "mongoose";
import RestaurantMenuItem from "../models/RestaurantMenuItem.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

const allowedDietaryTags = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Halal",
];

const allowedSpicyLevels = [
  "None",
  "Mild",
  "Medium",
  "Hot",
  "Extra Hot",
];

function normalizeText(value = "") {
  return String(value || "").trim();
}

function normalizeDietaryTags(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map((tag) => normalizeText(tag))
        .filter((tag) =>
          allowedDietaryTags.includes(tag)
        )
    ),
  ];
}

async function findOwnedRestaurant(
  listingId,
  ownerId
) {
  if (
    typeof listingId !== "string" ||
    !mongoose.Types.ObjectId.isValid(
      listingId.trim()
    )
  ) {
    return null;
  }

  return Listing.findOne({
    _id: listingId.trim(),
    ownerId,
  }).populate("categoryId", "slug");
}

/*
  PUBLIC
  Get available menu items for an approved Restaurant
*/
router.get(
  "/public/:listingId",
  async (req, res) => {
    try {
      const { listingId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          listingId
        )
      ) {
        return res.status(400).json({
          message: "Invalid restaurant listing ID.",
        });
      }

      const listing = await Listing.findById(
        listingId
      ).populate("categoryId", "slug");

      if (!listing) {
        return res.status(404).json({
          message: "Restaurant not found.",
        });
      }

      if (
        listing.status !== "approved" ||
        listing.categoryId?.slug !==
          "restaurant"
      ) {
        return res.status(404).json({
          message:
            "Restaurant menu is not available.",
        });
      }

      const items =
        await RestaurantMenuItem.find({
          listingId: listing._id,
          isAvailable: true,
        }).sort({
          category: 1,
          displayOrder: 1,
          createdAt: 1,
        });

      return res.json(items);
    } catch (err) {
      console.error(
        "Load public restaurant menu error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load restaurant menu.",
      });
    }
  }
);

/*
  OWNER
  Get all menu items for logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const items =
        await RestaurantMenuItem.find({
          ownerId: req.owner.id,
        })
          .populate(
            "listingId",
            "title city state status"
          )
          .sort({
            category: 1,
            displayOrder: 1,
            createdAt: 1,
          });

      return res.json(items);
    } catch (err) {
      console.error(
        "Load owner restaurant menu error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load restaurant menu.",
      });
    }
  }
);

/*
  OWNER
  Create a Restaurant menu item
*/
router.post(
  "/",
  requireOwner,
  async (req, res) => {
    try {
      const {
        listingId,
        category,
        name,
        description = "",
        price,
        imageUrl = "",
        isAvailable = true,
        dietaryTags = [],
        spicyLevel = "None",
        displayOrder = 0,
      } = req.body;

      const cleanCategory =
        normalizeText(category);

      const cleanName = normalizeText(name);

      if (
        !listingId ||
        !cleanCategory ||
        !cleanName ||
        price === undefined ||
        price === null ||
        price === ""
      ) {
        return res.status(400).json({
          message:
            "Restaurant, category, item name, and price are required.",
        });
      }

      const numericPrice = Number(price);

      if (
        !Number.isFinite(numericPrice) ||
        numericPrice < 0
      ) {
        return res.status(400).json({
          message:
            "Please provide a valid menu item price.",
        });
      }

      const restaurant =
        await findOwnedRestaurant(
          listingId,
          req.owner.id
        );

      if (!restaurant) {
        return res.status(404).json({
          message:
            "Restaurant listing not found or you do not own this listing.",
        });
      }

      if (
        restaurant.categoryId?.slug !==
        "restaurant"
      ) {
        return res.status(400).json({
          message:
            "Menu items can only be added to Restaurant listings.",
        });
      }

      if (
        !allowedSpicyLevels.includes(
          spicyLevel
        )
      ) {
        return res.status(400).json({
          message: "Invalid spicy level.",
        });
      }

      const numericDisplayOrder =
        Number(displayOrder);

      const item =
        await RestaurantMenuItem.create({
          listingId: restaurant._id,
          ownerId: req.owner.id,
          category: cleanCategory,
          name: cleanName,
          description:
            normalizeText(description),
          price: numericPrice,
          imageUrl: normalizeText(imageUrl),
          isAvailable:
            isAvailable !== false,
          dietaryTags:
            normalizeDietaryTags(
              dietaryTags
            ),
          spicyLevel,
          displayOrder:
            Number.isFinite(
              numericDisplayOrder
            ) &&
            numericDisplayOrder >= 0
              ? numericDisplayOrder
              : 0,
        });

      return res.status(201).json(item);
    } catch (err) {
      console.error(
        "Create restaurant menu item error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to create restaurant menu item.",
      });
    }
  }
);

/*
  OWNER
  Update a Restaurant menu item
*/
router.patch(
  "/:id",
  requireOwner,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid menu item ID.",
        });
      }

      const item =
        await RestaurantMenuItem.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!item) {
        return res.status(404).json({
          message:
            "Restaurant menu item not found.",
        });
      }

      const {
        category,
        name,
        description,
        price,
        imageUrl,
        isAvailable,
        dietaryTags,
        spicyLevel,
        displayOrder,
      } = req.body;

      if (category !== undefined) {
        const cleanCategory =
          normalizeText(category);

        if (!cleanCategory) {
          return res.status(400).json({
            message:
              "Menu category cannot be empty.",
          });
        }

        item.category = cleanCategory;
      }

      if (name !== undefined) {
        const cleanName =
          normalizeText(name);

        if (!cleanName) {
          return res.status(400).json({
            message:
              "Menu item name cannot be empty.",
          });
        }

        item.name = cleanName;
      }

      if (description !== undefined) {
        item.description =
          normalizeText(description);
      }

      if (price !== undefined) {
        const numericPrice =
          Number(price);

        if (
          !Number.isFinite(numericPrice) ||
          numericPrice < 0
        ) {
          return res.status(400).json({
            message:
              "Please provide a valid menu item price.",
          });
        }

        item.price = numericPrice;
      }

      if (imageUrl !== undefined) {
        item.imageUrl =
          normalizeText(imageUrl);
      }

      if (isAvailable !== undefined) {
        if (
          typeof isAvailable !==
          "boolean"
        ) {
          return res.status(400).json({
            message:
              "Availability must be true or false.",
          });
        }

        item.isAvailable = isAvailable;
      }

      if (dietaryTags !== undefined) {
        if (!Array.isArray(dietaryTags)) {
          return res.status(400).json({
            message:
              "Dietary tags must be an array.",
          });
        }

        item.dietaryTags =
          normalizeDietaryTags(
            dietaryTags
          );
      }

      if (spicyLevel !== undefined) {
        if (
          !allowedSpicyLevels.includes(
            spicyLevel
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid spicy level.",
          });
        }

        item.spicyLevel = spicyLevel;
      }

      if (displayOrder !== undefined) {
        const numericDisplayOrder =
          Number(displayOrder);

        if (
          !Number.isFinite(
            numericDisplayOrder
          ) ||
          numericDisplayOrder < 0
        ) {
          return res.status(400).json({
            message:
              "Display order must be zero or greater.",
          });
        }

        item.displayOrder =
          numericDisplayOrder;
      }

      await item.save();

      return res.json(item);
    } catch (err) {
      console.error(
        "Update restaurant menu item error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update restaurant menu item.",
      });
    }
  }
);

/*
  OWNER
  Delete a Restaurant menu item
*/
router.delete(
  "/:id",
  requireOwner,
  async (req, res) => {
    try {
      if (
        !mongoose.Types.ObjectId.isValid(
          req.params.id
        )
      ) {
        return res.status(400).json({
          message: "Invalid menu item ID.",
        });
      }

      const item =
        await RestaurantMenuItem.findOneAndDelete({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!item) {
        return res.status(404).json({
          message:
            "Restaurant menu item not found.",
        });
      }

      return res.json({
        message:
          "Restaurant menu item deleted successfully.",
      });
    } catch (err) {
      console.error(
        "Delete restaurant menu item error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to delete restaurant menu item.",
      });
    }
  }
);

export default router;
