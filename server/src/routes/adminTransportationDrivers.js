import express from "express";
import mongoose from "mongoose";
import TransportationDriver from "../models/TransportationDriver.js";
import Listing from "../models/Listing.js";
import Category from "../models/Category.js";
import {
  requireAdmin,
  requireRole,
} from "../middleware/auth.js";

const router = express.Router();

function cleanText(value) {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parsePositiveInteger(value, fallback, maximum) {
  const number = Number.parseInt(value, 10);

  if (!Number.isFinite(number) || number < 1) {
    return fallback;
  }

  return Math.min(number, maximum);
}

const ALLOWED_VERIFICATION_STATUSES = [
  "not_submitted",
  "pending",
  "approved",
  "rejected",
];

const ALLOWED_DRIVER_STATUSES = [
  "pending",
  "active",
  "suspended",
  "inactive",
];

/*
|--------------------------------------------------------------------------
| GET TRANSPORTATION DRIVERS
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin",
    "verification_agent",
    "support_agent"
  ),
  async (req, res) => {
    try {
      const {
        search,
        verificationStatus,
        status,
        businessListingId,
        ownerId,
      } = req.query;

      const page = parsePositiveInteger(
        req.query.page,
        1,
        100000
      );

      const limit = parsePositiveInteger(
        req.query.limit,
        25,
        100
      );

      const transportationCategory =
        await Category.findOne({
          slug: "transportation",
        })
          .select("_id")
          .lean();

      if (!transportationCategory) {
        return res.status(500).json({
          message:
            "Transportation category is unavailable.",
        });
      }

      const transportationListingIds =
        await Listing.find({
          categoryId: transportationCategory._id,
        }).distinct("_id");

      const query = {
        businessListingId: {
          $in: transportationListingIds,
        },
      };

      const cleanedVerificationStatus =
        cleanText(verificationStatus);

      if (
        cleanedVerificationStatus &&
        cleanedVerificationStatus !== "All" &&
        ALLOWED_VERIFICATION_STATUSES.includes(
          cleanedVerificationStatus
        )
      ) {
        query.verificationStatus =
          cleanedVerificationStatus;
      }

      const cleanedStatus = cleanText(status);

      if (
        cleanedStatus &&
        cleanedStatus !== "All" &&
        ALLOWED_DRIVER_STATUSES.includes(cleanedStatus)
      ) {
        query.status = cleanedStatus;
      }

      if (
        businessListingId &&
        mongoose.Types.ObjectId.isValid(
          businessListingId
        )
      ) {
        const isTransportationListing =
          transportationListingIds.some(
            (listingId) =>
              String(listingId) ===
              String(businessListingId)
          );

        if (!isTransportationListing) {
          return res.status(400).json({
            message:
              "This listing is not a Transportation business.",
          });
        }

        query.businessListingId =
          businessListingId;
      }

      if (
        ownerId &&
        mongoose.Types.ObjectId.isValid(ownerId)
      ) {
        query.ownerId = ownerId;
      }

      const cleanedSearch = cleanText(search);

      if (cleanedSearch) {
        const safeSearch = escapeRegex(cleanedSearch);
        const searchRegex = new RegExp(
          safeSearch,
          "i"
        );

        query.$or = [
          { fullName: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { serviceTypes: searchRegex },
        ];
      }

      const skip = (page - 1) * limit;

      const [drivers, total] = await Promise.all([
        TransportationDriver.find(query)
          .populate({
            path: "businessListingId",
            select:
              "title categoryId ownerId city state status",
            populate: {
              path: "categoryId",
              select: "name_en slug",
            },
          })
          .populate(
            "ownerId",
            "name email phone role"
          )
          .populate(
            "lastAdminUpdatedBy",
            "email role"
          )
          .populate(
            "adminAuditLog.adminId",
            "email role"
          )
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),

        TransportationDriver.countDocuments(query),
      ]);

      res.json({
        drivers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.max(
            1,
            Math.ceil(total / limit)
          ),
          hasNextPage: page * limit < total,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error(
        "Admin transportation drivers load failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to load transportation drivers.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE DRIVER VERIFICATION
|--------------------------------------------------------------------------
*/

router.patch(
  "/:driverId/verification",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin",
    "verification_agent"
  ),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(driverId)
      ) {
        return res.status(400).json({
          message:
            "Invalid transportation driver ID.",
        });
      }

      const verificationStatus = cleanText(
        req.body?.verificationStatus
      );

      const note = cleanText(req.body?.note);

      if (note.length > 2000) {
        return res.status(400).json({
          message: "Admin note is too long.",
        });
      }

      if (
        !["approved", "rejected"].includes(
          verificationStatus
        )
      ) {
        return res.status(400).json({
          message:
            "Verification status must be approved or rejected.",
        });
      }

      const driver =
        await TransportationDriver.findById(
          driverId
        ).populate({
          path: "businessListingId",
          select: "categoryId",
          populate: {
            path: "categoryId",
            select: "slug",
          },
        });

      if (!driver) {
        return res.status(404).json({
          message:
            "Transportation driver not found.",
        });
      }

      if (
        driver.businessListingId?.categoryId?.slug !==
        "transportation"
      ) {
        return res.status(400).json({
          message:
            "Driver is not associated with a Transportation business.",
        });
      }

      const previousVerificationStatus =
        driver.verificationStatus;

      driver.verificationStatus =
        verificationStatus;

      driver.lastAdminUpdatedBy =
        req.admin.id;

      driver.lastAdminUpdatedAt =
        new Date();

      driver.adminAuditLog.push({
        action: "Verification Updated",
        previousStatus:
          previousVerificationStatus,
        newStatus: verificationStatus,
        note,
        adminId: req.admin.id,
        adminEmail:
          req.admin.email || "",
      });

      await driver.save();

      const updatedDriver =
        await TransportationDriver.findById(
          driver._id
        )
          .populate({
            path: "businessListingId",
            select:
              "title categoryId ownerId city state status",
            populate: {
              path: "categoryId",
              select: "name_en slug",
            },
          })
          .populate(
            "ownerId",
            "name email phone role"
          )
          .populate(
            "lastAdminUpdatedBy",
            "email role"
          )
          .populate(
            "adminAuditLog.adminId",
            "email role"
          )
          .lean();

      res.json({
        message:
          "Transportation driver verification updated successfully.",
        driver: updatedDriver,
      });
    } catch (error) {
      console.error(
        "Update transportation driver verification failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update transportation driver verification.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| UPDATE DRIVER OPERATIONAL STATUS
|--------------------------------------------------------------------------
*/

router.patch(
  "/:driverId/status",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin"
  ),
  async (req, res) => {
    try {
      const { driverId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(driverId)
      ) {
        return res.status(400).json({
          message:
            "Invalid transportation driver ID.",
        });
      }

      const action = cleanText(
        req.body?.action
      ).toLowerCase();

      const note = cleanText(req.body?.note);

      if (note.length > 2000) {
        return res.status(400).json({
          message: "Admin note is too long.",
        });
      }

      if (
        !["suspend", "unsuspend"].includes(action)
      ) {
        return res.status(400).json({
          message:
            "Driver status action must be suspend or unsuspend.",
        });
      }

      const driver =
        await TransportationDriver.findById(
          driverId
        ).populate({
          path: "businessListingId",
          select: "categoryId",
          populate: {
            path: "categoryId",
            select: "slug",
          },
        });

      if (!driver) {
        return res.status(404).json({
          message:
            "Transportation driver not found.",
        });
      }

      if (
        driver.businessListingId?.categoryId?.slug !==
        "transportation"
      ) {
        return res.status(400).json({
          message:
            "Driver is not associated with a Transportation business.",
        });
      }

      const previousStatus = driver.status;

      if (action === "suspend") {
  if (driver.status === "suspended") {
    return res.status(400).json({
      message:
        "Transportation driver is already suspended.",
    });
  }

  driver.status = "suspended";
  driver.availabilityStatus = "offline";
} else {
        if (driver.status !== "suspended") {
          return res.status(400).json({
            message:
              "Only a suspended driver can be unsuspended.",
          });
        }

        driver.status = "inactive";
        driver.availabilityStatus = "offline";
      }

      driver.lastAdminUpdatedBy =
        req.admin.id;
      driver.lastAdminUpdatedAt =
        new Date();

      driver.adminAuditLog.push({
        action:
          action === "suspend"
            ? "Driver Suspended"
            : "Driver Unsuspended",
        previousStatus,
        newStatus: driver.status,
        note,
        adminId: req.admin.id,
        adminEmail:
          req.admin.email || "",
      });

      await driver.save();

      const updatedDriver =
        await TransportationDriver.findById(
          driver._id
        )
          .populate({
            path: "businessListingId",
            select:
              "title categoryId ownerId city state status",
            populate: {
              path: "categoryId",
              select: "name_en slug",
            },
          })
          .populate(
            "ownerId",
            "name email phone role"
          )
          .populate(
            "lastAdminUpdatedBy",
            "email role"
          )
          .populate(
            "adminAuditLog.adminId",
            "email role"
          )
          .lean();

      res.json({
        message:
          action === "suspend"
            ? "Transportation driver suspended successfully."
            : "Transportation driver unsuspended successfully.",
        driver: updatedDriver,
      });
    } catch (error) {
      console.error(
        "Update transportation driver operational status failed:",
        error
      );

      res.status(500).json({
        message:
          "Failed to update transportation driver operational status.",
      });
    }
  }
);

export default router;
