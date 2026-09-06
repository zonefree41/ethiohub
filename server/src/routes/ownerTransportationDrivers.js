import express from "express";
import mongoose from "mongoose";

import TransportationDriver from "../models/TransportationDriver.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

const allowedServiceTypes = [
  "Furniture Delivery",
  "Package Delivery",
  "Moving Service",
  "Airport Transportation",
  "Freight Delivery",
  "Other",
];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

router.use(requireOwner);

/*
OWNER

Create a driver for one owned Transportation listing
*/

router.post("/", async (req, res) => {
  try {
    const {
      businessListingId,
      fullName,
      email,
      phone,
      serviceTypes,
    } = req.body || {};

    const cleanedBusinessListingId = cleanText(businessListingId);
    const cleanedFullName = cleanText(fullName);
    const cleanedEmail = cleanText(email).toLowerCase();
    const cleanedPhone = cleanText(phone);

    if (
      !cleanedBusinessListingId ||
      !mongoose.Types.ObjectId.isValid(cleanedBusinessListingId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation listing ID is required.",
      });
    }

    if (!cleanedFullName) {
      return res.status(400).json({
        message: "Driver name is required.",
      });
    }

    if (cleanedFullName.length > 120) {
      return res.status(400).json({
        message: "Driver name is too long.",
      });
    }

    if (!cleanedPhone) {
      return res.status(400).json({
        message: "Driver phone number is required.",
      });
    }

    if (cleanedPhone.length > 40) {
      return res.status(400).json({
        message: "Driver phone number is too long.",
      });
    }

    if (cleanedEmail.length > 160) {
      return res.status(400).json({
        message: "Driver email is too long.",
      });
    }

    if (
      cleanedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid driver email address.",
      });
    }

    if (
      serviceTypes !== undefined &&
      !Array.isArray(serviceTypes)
    ) {
      return res.status(400).json({
        message: "Driver service types must be an array.",
      });
    }

    const cleanedServiceTypes = Array.isArray(serviceTypes)
      ? [...new Set(serviceTypes.map(cleanText).filter(Boolean))]
      : [];

    if (
      cleanedServiceTypes.some(
        (serviceType) =>
          !allowedServiceTypes.includes(serviceType)
      )
    ) {
      return res.status(400).json({
        message: "Invalid driver service type.",
      });
    }

    const listing = await Listing.findOne({
      _id: cleanedBusinessListingId,
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

    const driver = await TransportationDriver.create({
      ownerId: req.owner.id,
      businessListingId: listing._id,
      fullName: cleanedFullName,
      email: cleanedEmail,
      phone: cleanedPhone,
      serviceTypes: cleanedServiceTypes,
      status: "pending",
      verificationStatus: "not_submitted",
      availabilityStatus: "offline",
    });

    return res.status(201).json(driver);
  } catch (err) {
    console.error(
      "Create Transportation driver error:",
      err
    );

    return res.status(500).json({
      message: "Failed to create Transportation driver.",
    });
  }
});

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
