import express from "express";
import ClaimRequest from "../models/ClaimRequest.js";

const router = express.Router();

/**
 * Public: Submit a claim request
 * POST /api/claims
 */
router.post("/", async (req, res) => {
  try {
    const { listingId, businessName, ownerName, email, phone, message } = req.body;

    if (!listingId || !businessName || !ownerName || !email) {
      return res.status(400).json({
        message: "Listing, business name, owner name, and email are required.",
      });
    }

    const claim = await ClaimRequest.create({
      listingId,
      businessName,
      ownerName,
      email,
      phone,
      message,
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
router.get("/admin", async (req, res) => {
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
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        message: "Invalid claim status.",
      });
    }

    const claim = await ClaimRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!claim) {
      return res.status(404).json({
        message: "Claim request not found.",
      });
    }

    res.json({
      message: "Claim status updated.",
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