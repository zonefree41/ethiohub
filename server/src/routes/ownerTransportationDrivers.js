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

    if (cleanedEmail) {
      const existingDriver = await TransportationDriver.findOne({
        email: cleanedEmail,
      }).select("_id");

      if (existingDriver) {
        return res.status(409).json({
          message: "A Transportation driver with this email already exists.",
        });
      }
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

Deactivate or reactivate one owned Transportation driver
*/

router.patch("/:driverId/status", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);
    const action = cleanText(req.body?.action).toLowerCase();

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    if (!["deactivate", "reactivate"].includes(action)) {
      return res.status(400).json({
        message:
          "Driver status action must be deactivate or reactivate.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    });

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (driver.status === "suspended") {
      return res.status(403).json({
        message:
          "A suspended driver status cannot be changed by the business owner.",
      });
    }

    if (action === "deactivate") {
      driver.status = "inactive";
      driver.availabilityStatus = "offline";

      await driver.save();

      return res.json(driver);
    }

    if (driver.verificationStatus !== "approved") {
      return res.status(400).json({
        message:
          "Driver verification must be approved before reactivation.",
      });
    }

    driver.status = "active";
    driver.availabilityStatus = "offline";

    await driver.save();

    return res.json(driver);
  } catch (err) {
    console.error(
      "Update Transportation driver status error:",
      err
    );

    return res.status(500).json({
      message: "Failed to update Transportation driver status.",
    });
  }
});

/*
OWNER

Update availability for one owned Transportation driver

*/
router.patch("/:driverId/availability", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);
    const availabilityStatus = cleanText(
      req.body?.availabilityStatus
    ).toLowerCase();

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    if (!["available", "offline"].includes(availabilityStatus)) {
      return res.status(400).json({
        message:
          "Driver availability must be available or offline.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    });

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (availabilityStatus === "offline") {
      driver.availabilityStatus = "offline";
      await driver.save();
      return res.json(driver);
    }

    if (driver.status !== "active") {
      return res.status(400).json({
        message:
          "Driver must be active before becoming available.",
      });
    }

    if (driver.verificationStatus !== "approved") {
      return res.status(400).json({
        message:
          "Driver verification must be approved before becoming available.",
      });
    }

    driver.availabilityStatus = "available";
    await driver.save();

    return res.json(driver);
  } catch (err) {
    console.error(
      "Update Transportation driver availability error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to update Transportation driver availability.",
    });
  }
});

/*
OWNER

Update basic information for one owned Transportation driver

*/

router.patch("/:driverId", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    const {
      fullName,
      email,
      phone,
      serviceTypes,
    } = req.body || {};

    const updates = {};

    if (fullName !== undefined) {
      const cleanedFullName = cleanText(fullName);

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

      updates.fullName = cleanedFullName;
    }

    if (email !== undefined) {
      const cleanedEmail = cleanText(email).toLowerCase();

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

      updates.email = cleanedEmail;
    }

    if (phone !== undefined) {
      const cleanedPhone = cleanText(phone);

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

      updates.phone = cleanedPhone;
    }

    if (serviceTypes !== undefined) {
      if (!Array.isArray(serviceTypes)) {
        return res.status(400).json({
          message: "Driver service types must be an array.",
        });
      }

      const cleanedServiceTypes = [
        ...new Set(serviceTypes.map(cleanText).filter(Boolean)),
      ];

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

      updates.serviceTypes = cleanedServiceTypes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No driver fields to update.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    });

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (updates.email) {
      const existingDriver = await TransportationDriver.findOne({
        email: updates.email,
        _id: { $ne: driver._id },
      }).select("_id");

      if (existingDriver) {
        return res.status(409).json({
          message: "A Transportation driver with this email already exists.",
        });
      }
    }

    Object.assign(driver, updates);

    await driver.save();

    return res.json(driver);
  } catch (err) {
    console.error(
      "Update Transportation driver error:",
      err
    );

    return res.status(500).json({
      message: "Failed to update Transportation driver.",
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
