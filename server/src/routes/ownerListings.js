import express from "express";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

router.use(requireOwner);

/**
 * Get listings owned by logged-in business owner
 */
router.get("/my-listings", async (req, res) => {
  try {
    const listings = await Listing.find({
      ownerId: req.owner.id,
    })
      .populate("categoryId")
      .sort({ createdAt: -1 });

    res.json(listings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load owner listings" });
  }
});

/**
 * Claim an existing listing by ID
 * Temporary/simple version for now.
 */
router.patch("/claim/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    if (listing.ownerId && String(listing.ownerId) !== String(req.owner.id)) {
      return res.status(403).json({ message: "This listing is already claimed" });
    }

    listing.ownerId = req.owner.id;
    await listing.save();

    res.json({
      message: "Listing claimed successfully",
      listing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to claim listing" });
  }
});

/**
 * Update owned listing
 */
router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findOne({
      _id: req.params.id,
      ownerId: req.owner.id,
    }).populate("categoryId");

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found or you do not own this listing",
      });
    }

    res.json(listing);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load listing" });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    console.log("OWNER PATCH BODY:", req.body);

    const listing = await Listing.findOne({
      _id: req.params.id,
      ownerId: req.owner.id,
    });

    if (!listing) {
      return res.status(404).json({
        message: "Listing not found or you do not own this listing",
      });
    }

    const allowedFields = [
      "title",
      "phone",
      "whatsapp",
      "website",
      "businessHours",
      "address",
      "city",
      "state",
      "zip",
      "description_en",
      "description_am",
      "logoUrl",
      "imageUrl",
      "propertyVideoUrl",
      "availabilityStatus",
"availableFrom",
"propertyImages",

"monthlyRent",
"bedrooms",
"bathrooms",
"squareFeet",
"securityDeposit",
"leaseTerm",
"parking",
"petsAllowed",
"utilitiesIncluded",
"furnished",

"transportVehicleTypes",
"transportServiceArea",
"transportAvailable24_7",
"transportAirportService",
"transportSameDayService",
"transportLocalLongDistance",
"transportMaxLoad",

"beautyServices",
"beautyStartingPrice",
"beautyServes",
    ];

    const updates = {};

    for (const field of allowedFields) {
      if (field in req.body) {
        updates[field] =
          typeof req.body[field] === "string"
            ? req.body[field].trim()
            : req.body[field];
      }
    }

    const blockedPhrases = [
  "your website is hacked",
  "hacked",
  "test@gmail.com",
];

const spamText = Object.values(updates)
  .filter((value) => typeof value === "string")
  .join(" ")
  .toLowerCase();

if (blockedPhrases.some((phrase) => spamText.includes(phrase))) {
  return res.status(400).json({
    message: "Update rejected as spam.",
  });
}

    if ("propertyImages" in updates) {
  updates.propertyImages = Array.isArray(updates.propertyImages)
    ? updates.propertyImages.slice(0, 20)
    : [];
}

    if (
  updates.availabilityStatus &&
  !["available", "rented"].includes(updates.availabilityStatus)
) {
  return res.status(400).json({
    message: "Invalid availability status.",
  });
}

if ("availableFrom" in updates) {
  updates.availableFrom = updates.availableFrom
    ? new Date(updates.availableFrom)
    : null;
}

const numberFields = [
  "monthlyRent",
  "bedrooms",
  "bathrooms",
  "squareFeet",
  "securityDeposit",
];

for (const field of numberFields) {
  if (field in updates) {
    updates[field] =
      updates[field] === "" || updates[field] === null
        ? null
        : Number(updates[field]);

    if (updates[field] !== null && Number.isNaN(updates[field])) {
      return res.status(400).json({
        message: `Invalid number for ${field}.`,
      });
    }
  }
}

const booleanFields = [
  "parking",
  "petsAllowed",
  "utilitiesIncluded",
  "furnished",
   "parking",
  "petsAllowed",
  "utilitiesIncluded",
  "furnished",
  "transportAvailable24_7",
  "transportAirportService",
  "transportSameDayService",
];

for (const field of booleanFields) {
  if (field in updates) {
    updates[field] =
      updates[field] === true || updates[field] === "true";
  }
}

if (
  "leaseTerm" in updates &&
  !["", "Month-to-Month", "6 Months", "12 Months", "Flexible"].includes(
    updates.leaseTerm
  )
) {
  return res.status(400).json({
    message: "Invalid lease term.",
  });
}

if (
  "transportLocalLongDistance" in updates &&
  !["", "Local", "Long Distance", "Both"].includes(updates.transportLocalLongDistance)
) {
  return res.status(400).json({
    message: "Invalid transportation distance option.",
  });
}

if ("transportVehicleTypes" in updates) {
  updates.transportVehicleTypes = Array.isArray(updates.transportVehicleTypes)
    ? updates.transportVehicleTypes
    : [];
}

if ("beautyServices" in updates) {
  updates.beautyServices = Array.isArray(updates.beautyServices)
    ? updates.beautyServices
    : [];
}

if ("beautyServes" in updates) {
  updates.beautyServes = Array.isArray(updates.beautyServes)
    ? updates.beautyServes
    : [];
}

    const sensitiveFields = [
      "title",
      "address",
      "city",
      "state",
      "zip",
      "description_en",
      "description_am",
    ];

    const hasSensitiveChange = sensitiveFields.some((field) => {
      if (!(field in updates)) return false;

      const oldValue = String(listing[field] || "").trim();
      const newValue = String(updates[field] || "").trim();

      return oldValue !== newValue;
    });

    if (listing.status !== "approved" || hasSensitiveChange) {
      updates.status = "pending";
    }

    updates.updatedAt = new Date();

    console.log("OWNER UPDATES:", updates);
    console.log("HAS SENSITIVE CHANGE:", hasSensitiveChange);

    const updatedListing = await Listing.findOneAndUpdate(
      {
        _id: req.params.id,
        ownerId: req.owner.id,
      },
      { $set: updates },
      { new: true }
    ).populate("categoryId");

    res.json({
      message:
        hasSensitiveChange || listing.status !== "approved"
          ? "Listing updated and sent for admin review."
          : "Listing updated successfully.",
      listing: updatedListing,
    });
  } catch (err) {
    console.error("Owner listing update failed:", err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

export default router;