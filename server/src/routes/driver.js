import express from "express";

import TransportationDriver from "../models/TransportationDriver.js";
import TransportationRequest from "../models/TransportationRequest.js";
import { requireDriver } from "../middleware/driverAuth.js";

const router = express.Router();

router.use(requireDriver);

router.get("/me", async (req, res) => {
  try {
    const driver = await TransportationDriver.findById(
      req.driver.id
    ).select(
      "_id ownerId businessListingId fullName email phone serviceTypes driverAccountStatus status verificationStatus availabilityStatus createdAt updatedAt"
    );

    if (!driver) {
      return res.status(404).json({
        message: "Transportation driver not found.",
      });
    }

    return res.json({
      driver,
    });
  } catch (err) {
    console.error(
      "Get Transportation driver profile error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to load Transportation driver profile.",
    });
  }
});

router.get("/jobs", async (req, res) => {
  try {
    const requests = await TransportationRequest.find({
      driverId: req.driver.id,
    })
      .select(
        "_id listingId customerName customerPhone pickupAddress deliveryAddress requestedDate requestedTime cargoDetails cargoPhotos serviceType status quoteAmount estimatedArrival driverName driverPhone vehicleDescription licensePlate driverAssignedAt inProgressAt completedAt cancelledAt createdAt updatedAt"
      )
      .sort({ createdAt: -1 })
      .populate("listingId", "title");

    return res.json(requests);
  } catch (err) {
    console.error(
      "Load Transportation driver jobs error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to load assigned Transportation jobs.",
    });
  }
});

router.patch("/availability", async (req, res) => {
  try {
    const { availabilityStatus } = req.body || {};

    if (
      !["available", "offline"].includes(
        availabilityStatus
      )
    ) {
      return res.status(400).json({
        message:
          "Availability must be available or offline.",
      });
    }

    const driver = await TransportationDriver.findById(
      req.driver.id
    ).select(
      "_id ownerId businessListingId fullName email phone serviceTypes driverAccountStatus status verificationStatus availabilityStatus createdAt updatedAt"
    );

    if (!driver) {
      return res.status(404).json({
        message: "Transportation driver not found.",
      });
    }

    if (
      availabilityStatus === "available" &&
      (
        driver.status !== "active" ||
        driver.verificationStatus !== "approved"
      )
    ) {
      return res.status(403).json({
        message:
          "Driver must be active and approved to go available.",
      });
    }

    driver.availabilityStatus = availabilityStatus;
    await driver.save();

    return res.json({
      driver,
    });
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

export default router;
