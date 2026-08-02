import express from "express";
import mongoose from "mongoose";

import HousingRequest from "../models/HousingRequest.js";
import { requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const ALLOWED_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "closed",
];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
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

/*
|--------------------------------------------------------------------------
| GET ALL HOUSING REQUESTS
|--------------------------------------------------------------------------
|
| GET /api/admin/housing-requests
|
| Query:
| search
| status
| housingType
| state
| page
| limit
|
*/
router.get("/", requireAdmin, async (req, res) => {
  try {
    const {
      search = "",
      status = "",
      housingType = "",
      state = "",
    } = req.query;

    const page = parsePositiveInteger(req.query.page, 1, 100000);
    const limit = parsePositiveInteger(req.query.limit, 25, 100);

    const query = {};

    const cleanedStatus = cleanText(status).toLowerCase();

    if (
      cleanedStatus &&
      cleanedStatus !== "all" &&
      ALLOWED_STATUSES.includes(cleanedStatus)
    ) {
      query.status = cleanedStatus;
    }

    const cleanedHousingType = cleanText(housingType);

    if (cleanedHousingType && cleanedHousingType !== "All") {
      query.housingTypes = cleanedHousingType;
    }

    const cleanedState = cleanText(state).toUpperCase();

    if (cleanedState) {
      query.preferredState = cleanedState;
    }

    const cleanedSearch = cleanText(search);

    if (cleanedSearch) {
      const searchRegex = new RegExp(
        escapeRegex(cleanedSearch),
        "i"
      );

      query.$or = [
        { requesterName: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { preferredCities: searchRegex },
        { preferredState: searchRegex },
        { aboutMe: searchRegex },
        { adminNote: searchRegex },
      ];
    }

    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      HousingRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      HousingRequest.countDocuments(query),
    ]);

    return res.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    console.error(
      "Load admin housing requests failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to load housing requests.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| GET ONE HOUSING REQUEST
|--------------------------------------------------------------------------
|
| GET /api/admin/housing-requests/:id
|
*/
router.get("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid housing request ID.",
      });
    }

    const request = await HousingRequest.findById(id).lean();

    if (!request) {
      return res.status(404).json({
        message: "Housing request not found.",
      });
    }

    return res.json({
      request,
    });
  } catch (error) {
    console.error(
      "Load housing request details failed:",
      error
    );

    return res.status(500).json({
      message: "Failed to load housing request details.",
    });
  }
});

/*
|--------------------------------------------------------------------------
| UPDATE HOUSING REQUEST STATUS
|--------------------------------------------------------------------------
|
| PATCH /api/admin/housing-requests/:id/status
|
| Body:
| {
|   "status": "approved",
|   "note": "Approved after review."
| }
|
*/
router.patch(
  "/:id/status",
  requireAdmin,
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        status,
        note = "",
      } = req.body || {};

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid housing request ID.",
        });
      }

      const cleanedStatus = cleanText(status).toLowerCase();

      if (!ALLOWED_STATUSES.includes(cleanedStatus)) {
        return res.status(400).json({
          message: "Invalid housing request status.",
        });
      }

      const request = await HousingRequest.findById(id);

      if (!request) {
        return res.status(404).json({
          message: "Housing request not found.",
        });
      }

      request.status = cleanedStatus;

      // Only approved requests are publicly visible.
      request.isPublic = cleanedStatus === "approved";

      request.adminNote = cleanText(note);

      await request.save();

      return res.json({
        message:
          "Housing request status updated successfully.",
        request,
      });
    } catch (error) {
      console.error(
        "Update housing request status failed:",
        error
      );

      if (error?.name === "ValidationError") {
        return res.status(400).json({
          message:
            Object.values(error.errors)
              .map((item) => item.message)
              .join(", ") ||
            "Invalid housing request update.",
        });
      }

      return res.status(500).json({
        message:
          "Failed to update housing request status.",
      });
    }
  }
);

router.patch("/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid housing request ID.",
      });
    }

    const request = await HousingRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        message: "Housing request not found.",
      });
    }

    const {
      requesterName,
      email,
      phone,
      housingTypes,
      preferredCities,
      preferredState,
      moveInDate,
      budgetMin,
      budgetMax,
      leasePreference,
      aboutMe,
      smokingStatus,
      hasPets,
      needsParking,
      utilitiesPreferred,
      furnishedPreferred,
      contactPreference,
    } = req.body || {};

    if (requesterName !== undefined) {
      request.requesterName = cleanText(requesterName);
    }

    if (email !== undefined) {
      request.email = cleanText(email).toLowerCase();
    }

    if (phone !== undefined) {
      request.phone = cleanText(phone);
    }

    if (Array.isArray(housingTypes)) {
      request.housingTypes = housingTypes;
    }

    if (Array.isArray(preferredCities)) {
      request.preferredCities = preferredCities
        .map((city) => cleanText(city))
        .filter(Boolean);
    }

    if (preferredState !== undefined) {
      request.preferredState =
        cleanText(preferredState).toUpperCase();
    }

    if (moveInDate !== undefined) {
      request.moveInDate = moveInDate;
    }

    if (budgetMin !== undefined) {
      request.budgetMin = Number(budgetMin);
    }

    if (budgetMax !== undefined) {
      request.budgetMax = Number(budgetMax);
    }

    if (leasePreference !== undefined) {
      request.leasePreference = leasePreference;
    }

    if (aboutMe !== undefined) {
      request.aboutMe = cleanText(aboutMe);
    }

    if (smokingStatus !== undefined) {
      request.smokingStatus = smokingStatus;
    }

    if (hasPets !== undefined) {
      request.hasPets = Boolean(hasPets);
    }

    if (needsParking !== undefined) {
      request.needsParking = Boolean(needsParking);
    }

    if (utilitiesPreferred !== undefined) {
      request.utilitiesPreferred =
        Boolean(utilitiesPreferred);
    }

    if (furnishedPreferred !== undefined) {
      request.furnishedPreferred =
        Boolean(furnishedPreferred);
    }

    if (contactPreference !== undefined) {
      request.contactPreference = contactPreference;
    }

    if (
      Number.isFinite(request.budgetMin) &&
      Number.isFinite(request.budgetMax) &&
      request.budgetMax < request.budgetMin
    ) {
      return res.status(400).json({
        message:
          "Maximum budget must be greater than or equal to minimum budget.",
      });
    }

    await request.save();

    return res.json({
      message: "Housing request updated successfully.",
      request,
    });
  } catch (error) {
    console.error(
      "Update housing request details failed:",
      error
    );

    if (error?.name === "ValidationError") {
      return res.status(400).json({
        message:
          Object.values(error.errors)
            .map((item) => item.message)
            .join(", ") ||
          "Invalid housing request update.",
      });
    }

    return res.status(500).json({
      message: "Failed to update housing request.",
    });
  }
});

export default router;