import express from "express";
import HousingRequest from "../models/HousingRequest.js";

const router = express.Router();

/**
 * POST /api/housing-requests
 * Public: submit a new housing request
 */
router.post("/", async (req, res) => {
  try {
    const {
      requesterName,
      email = "",
      phone,
      housingTypes,
      preferredCities = [],
      preferredState,
      moveInDate,
      budgetMin,
      budgetMax,
      leasePreference = "Flexible",
      aboutMe,
      smokingStatus = "Prefer not to say",
      hasPets = false,
      needsParking = false,
      utilitiesPreferred = false,
      furnishedPreferred = false,
      contactPreference = "Either",
    } = req.body;

    if (
      !requesterName ||
      !phone ||
      !Array.isArray(housingTypes) ||
      housingTypes.length === 0 ||
      !preferredState ||
      !moveInDate ||
      budgetMin === undefined ||
      budgetMax === undefined ||
      !aboutMe
    ) {
      return res.status(400).json({
        message: "Please complete all required housing request fields.",
      });
    }

    const minBudget = Number(budgetMin);
    const maxBudget = Number(budgetMax);

    if (
      Number.isNaN(minBudget) ||
      Number.isNaN(maxBudget) ||
      minBudget < 0 ||
      maxBudget < minBudget
    ) {
      return res.status(400).json({
        message: "Please enter a valid minimum and maximum budget.",
      });
    }

    const request = await HousingRequest.create({
      requesterName,
      email,
      phone,
      housingTypes,
      preferredCities,
      preferredState,
      moveInDate,
      budgetMin: minBudget,
      budgetMax: maxBudget,
      leasePreference,
      aboutMe,
      smokingStatus,
      hasPets,
      needsParking,
      utilitiesPreferred,
      furnishedPreferred,
      contactPreference,
      status: "pending",
      isPublic: false,
    });

    return res.status(201).json({
      message: "Housing request submitted successfully and is pending review.",
      request,
    });
  } catch (err) {
    console.error("Create housing request failed:", err);

    if (err?.name === "ValidationError") {
      return res.status(400).json({
        message:
          Object.values(err.errors)
            .map((item) => item.message)
            .join(", ") || "Invalid housing request.",
      });
    }

    return res.status(500).json({
      message: "Failed to submit housing request.",
    });
  }
});

/**
 * GET /api/housing-requests
 * Public: list approved public housing requests
 */
router.get("/", async (req, res) => {
  try {
    const {
      housingType = "",
      city = "",
      state = "",
      minBudget = "",
      maxBudget = "",
    } = req.query;

    const filter = {
      status: "approved",
      isPublic: true,
    };

    if (housingType) {
      filter.housingTypes = housingType;
    }

    if (city) {
      filter.preferredCities = new RegExp(city.trim(), "i");
    }

    if (state) {
      filter.preferredState = state.trim().toUpperCase();
    }

    if (minBudget !== "") {
      filter.budgetMax = {
        ...(filter.budgetMax || {}),
        $gte: Number(minBudget),
      };
    }

    if (maxBudget !== "") {
      filter.budgetMin = {
        ...(filter.budgetMin || {}),
        $lte: Number(maxBudget),
      };
    }

    const requests = await HousingRequest.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    const safeRequests = requests.map((request) => ({
      _id: request._id,
      requesterName: request.requesterName,
      housingTypes: request.housingTypes,
      preferredCities: request.preferredCities,
      preferredState: request.preferredState,
      moveInDate: request.moveInDate,
      budgetMin: request.budgetMin,
      budgetMax: request.budgetMax,
      leasePreference: request.leasePreference,
      aboutMe: request.aboutMe,
      smokingStatus: request.smokingStatus,
      hasPets: request.hasPets,
      needsParking: request.needsParking,
      utilitiesPreferred: request.utilitiesPreferred,
      furnishedPreferred: request.furnishedPreferred,
      contactPreference: request.contactPreference,
      phone:
        request.contactPreference === "Phone" ||
        request.contactPreference === "Either"
          ? request.phone
          : "",
      email:
        request.contactPreference === "Email" ||
        request.contactPreference === "Either"
          ? request.email
          : "",
      createdAt: request.createdAt,
    }));

    return res.json(safeRequests);
  } catch (err) {
    console.error("Load housing requests failed:", err);

    return res.status(500).json({
      message: "Failed to load housing requests.",
    });
  }
});

export default router;