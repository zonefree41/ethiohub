import express from "express";
import mongoose from "mongoose";
import ClaimRequest from "../models/ClaimRequest.js";

const router = express.Router();

const ALLOWED_STATUSES = ["pending", "approved", "rejected"];

/**
 * Public: Submit a claim request
 * POST /api/claims
 */
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      businessName,
      ownerName,
      email,
      phone = "",
      message = "",
    } = req.body;

    if (!listingId || !businessName || !ownerName || !email) {
      return res.status(400).json({
        message: "Listing, business name, owner name, and email are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return res.status(400).json({
        message: "Invalid listing ID.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingPendingClaim = await ClaimRequest.findOne({
      listingId,
      email: normalizedEmail,
      status: "pending",
    });

    if (existingPendingClaim) {
      return res.status(409).json({
        message: "You already have a pending claim request for this business.",
      });
    }

    const claim = await ClaimRequest.create({
      listingId,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: normalizedEmail,
      phone: phone.trim(),
      message: message.trim(),
      status: "pending",
    });

    res.status(201).json({
      message: "Claim request submitted successfully.",
      claim,
    });
  } catch (error) {
    console.error("Submit claim error:", error);
    res.status(500).json({
      message: "Failed to submit claim request.",
    });
  }
});

/**
 * Admin: Get all claim requests
 * GET /api/claims/admin
 */
router.get("/admin", async (_req, res) => {
  try {
    const claims = await ClaimRequest.find()
      .populate("listingId")
      .sort({ createdAt: -1 });

    res.json(claims);
  } catch (error) {
    console.error("Get claims error:", error);
    res.status(500).json({
      message: "Failed to load claim requests.",
    });
  }
});

/**
 * Admin: Update claim status
 * PATCH /api/claims/admin/:id
 */
router.patch("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid claim request ID.",
      });
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        message: "Invalid claim status.",
      });
    }

    const claim = await ClaimRequest.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate("listingId");

    if (!claim) {
      return res.status(404).json({
        message: "Claim request not found.",
      });
    }

    res.json({
      message: `Claim ${status} successfully.`,
      claim,
    });
  } catch (error) {
    console.error("Update claim error:", error);
    res.status(500).json({
      message: "Failed to update claim status.",
    });
  }
});

export default router;