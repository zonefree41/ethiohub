import express from "express";
import ImmigrationConsultationRequest from "../models/ImmigrationConsultationRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

/*
  PUBLIC
  Create Immigration consultation request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      caseType,
      preferredConsultationDate = null,
      preferredConsultationTime = "",
      preferredContactMethod = "Either",
      message = "",
    } = req.body;

    if (
      !listingId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !caseType
    ) {
      return res.status(400).json({
        message:
          "Please provide all required consultation request information.",
      });
    }

    const listing = await Listing.findById(listingId);

    if (!listing) {
      return res.status(404).json({
        message: "Immigration Lawyer listing not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Immigration Lawyer listing is not currently accepting consultation requests.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const request =
      await ImmigrationConsultationRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId,
        customerName,
        customerEmail,
        customerPhone,
        caseType,
        preferredConsultationDate:
          preferredConsultationDate || null,
        preferredConsultationTime,
        preferredContactMethod,
        message,
      });

    return res.status(201).json({
      message:
        "Immigration consultation request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Immigration consultation request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Immigration consultation request.",
    });
  }
});

/*
  OWNER
  Get consultation requests for logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
        await ImmigrationConsultationRequest.find({
          ownerId: req.owner.id,
        })
          .populate(
            "listingId",
            "title city state status"
          )
          .sort({ createdAt: -1 });

      return res.json(requests);
    } catch (err) {
      console.error(
        "Load Immigration consultation requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Immigration consultation requests.",
      });
    }
  }
);

/*
  OWNER
  Update Immigration consultation request status
*/
router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const { status, ownerNotes = "" } = req.body;

      const allowedStatuses = [
        "New",
        "Contacted",
        "Consultation Scheduled",
        "Retained",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Immigration consultation status.",
        });
      }

      const request =
        await ImmigrationConsultationRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Immigration consultation request not found.",
        });
      }

      request.status = status;
      request.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

      if (status === "Contacted") {
        request.contactedAt = now;
      }

      if (status === "Consultation Scheduled") {
        request.consultationScheduledAt = now;
      }

      if (status === "Retained") {
        request.retainedAt = now;
      }

      if (status === "Declined") {
        request.declinedAt = now;
      }

      if (status === "Closed") {
        request.closedAt = now;
      }

      await request.save();

      await request.populate(
        "listingId",
        "title city state status"
      );

      return res.json({
        message:
          "Immigration consultation status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Immigration consultation status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Immigration consultation status.",
      });
    }
  }
);

export default router;