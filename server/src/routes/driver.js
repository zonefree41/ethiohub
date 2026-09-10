import express from "express";

import TransportationDriver from "../models/TransportationDriver.js";
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

export default router;
