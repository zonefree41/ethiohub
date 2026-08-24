import express from "express";
import VehicleListing from "../models/VehicleListing.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const allowedStatuses = new Set([
  "pending_review",
  "approved",
  "rejected",
  "sold",
  "expired",
]);

// Admin: list vehicle marketplace submissions
router.get("/", requireAdmin, async (req, res) => {
  try {
    const status = String(
      req.query.status || "pending_review"
    ).trim();

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({
        message: "Invalid vehicle listing status.",
      });
    }

    const vehicles = await VehicleListing.find({
      status,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json(vehicles);
  } catch (err) {
    console.error(
      "Load admin vehicle listings failed:",
      err.message
    );

    return res.status(500).json({
      message: "Failed to load vehicle listings.",
    });
  }
});

router.patch(
  "/:vehicleId/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const { vehicleId } = req.params;

      const vehicle = await VehicleListing.findById(
        vehicleId
      );

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle listing not found.",
        });
      }

      if (vehicle.paymentStatus !== "paid") {
        return res.status(400).json({
          message:
            "Vehicle listing must be paid before approval.",
        });
      }

      if (vehicle.status !== "pending_review") {
        return res.status(400).json({
          message:
            "Only vehicles pending review can be approved.",
        });
      }

      vehicle.status = "approved";
      vehicle.approvedAt = new Date();
      vehicle.rejectedAt = null;
      vehicle.rejectionReason = "";

      // V1 listing remains public for 30 days.
      vehicle.expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );

      await vehicle.save();

      return res.json({
        message: "Vehicle listing approved successfully.",
        vehicle,
      });
    } catch (err) {
      console.error(
        "Approve vehicle listing failed:",
        err.message
      );

      return res.status(500).json({
        message: "Failed to approve vehicle listing.",
      });
    }
  }
);

router.patch(
  "/:vehicleId/reject",
  requireAdmin,
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const rejectionReason =
        typeof req.body?.rejectionReason === "string"
          ? req.body.rejectionReason.trim()
          : "";

      if (!rejectionReason) {
        return res.status(400).json({
          message: "Rejection reason is required.",
        });
      }

      const vehicle = await VehicleListing.findById(
        vehicleId
      );

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle listing not found.",
        });
      }

      if (vehicle.paymentStatus !== "paid") {
        return res.status(400).json({
          message:
            "Vehicle listing must be paid before review.",
        });
      }

      if (vehicle.status !== "pending_review") {
        return res.status(400).json({
          message:
            "Only vehicles pending review can be rejected.",
        });
      }

      vehicle.status = "rejected";
      vehicle.rejectedAt = new Date();
      vehicle.approvedAt = null;
      vehicle.expiresAt = null;
      vehicle.rejectionReason =
        rejectionReason.slice(0, 1000);

      await vehicle.save();

      return res.json({
        message: "Vehicle listing rejected.",
        vehicle,
      });
    } catch (err) {
      console.error(
        "Reject vehicle listing failed:",
        err.message
      );

      return res.status(500).json({
        message: "Failed to reject vehicle listing.",
      });
    }
  }
);

export default router;