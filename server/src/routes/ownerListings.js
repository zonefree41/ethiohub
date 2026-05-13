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
      "address",
      "city",
      "state",
      "zip",
      "description_en",
      "description_am",
      "logoUrl",
      "imageUrl",
    ];

    for (const field of allowedFields) {
      if (field in req.body) {
        listing[field] = req.body[field];
      }
    }

    listing.status = "pending";

    await listing.save();

    res.json({
      message: "Listing updated and sent for admin review",
      listing,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

export default router;