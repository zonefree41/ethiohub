import express from "express";
import BusinessRequest from "../models/BusinessRequest.js";

const router = express.Router();

/**
 * Public: Submit business request
 * POST /api/business-requests
 */
router.post("/", async (req, res) => {
  try {
    const {
      businessName,
      category,
      city,
      state,
      phone,
      website,
      suggestedByName,
      suggestedByContact,
      message,
    } = req.body;

    if (!businessName) {
      return res.status(400).json({
        message: "Business name is required.",
      });
    }

    const request = await BusinessRequest.create({
      businessName,
      category,
      city,
      state,
      phone,
      website,
      suggestedByName,
      suggestedByContact,
      message,
    });

    res.status(201).json({
      message: "Business request submitted successfully.",
      request,
    });
  } catch (error) {
    console.error("Submit business request error:", error);
    res.status(500).json({
      message: "Failed to submit business request.",
    });
  }
});

/**
 * Admin: Get all business requests
 * GET /api/business-requests/admin
 */
router.get("/admin", async (req, res) => {
  try {
    const requests = await BusinessRequest.find().sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("Get business requests error:", error);
    res.status(500).json({
      message: "Failed to load business requests.",
    });
  }
});

/**
 * Admin: Update request status
 * PATCH /api/business-requests/admin/:id
 */
router.patch("/admin/:id", async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "added", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid request status.",
      });
    }

    const request = await BusinessRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) {
      return res.status(404).json({
        message: "Business request not found.",
      });
    }

    res.json({
      message: "Business request status updated.",
      request,
    });
  } catch (error) {
    console.error("Update business request error:", error);
    res.status(500).json({
      message: "Failed to update business request status.",
    });
  }
});

export default router;