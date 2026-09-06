import express from "express";
import mongoose from "mongoose";

import TransportationDriver from "../models/TransportationDriver.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

router.use(requireOwner);

/*
OWNER

Get drivers for one owned Transportation listing
*/

router.get("/", async (req, res) => {
  try {
    const businessListingId = String(
      req.query.businessListingId || ""
    ).trim();

    if (
      !businessListingId ||
      !mongoose.Types.ObjectId.isValid(businessListingId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation listing ID is required.",
      });
    }

    const listing = await Listing.findOne({
      _id: businessListingId,
      ownerId: req.owner.id,
    }).populate("categoryId", "name_en slug");

    if (!listing) {
      return res.status(404).json({
        message:
          "Transportation listing not found or you do not own this listing.",
      });
    }

    if (listing.categoryId?.slug !== "transportation") {
      return res.status(400).json({
        message: "This listing is not a Transportation business.",
      });
    }

    const drivers = await TransportationDriver.find({
      ownerId: req.owner.id,
      businessListingId: listing._id,
    }).sort({ createdAt: -1 });

    return res.json(drivers);
  } catch (err) {
    console.error(
      "Load Transportation drivers error:",
      err
    );

    return res.status(500).json({
      message: "Failed to load Transportation drivers.",
    });
  }
});

export default router;
