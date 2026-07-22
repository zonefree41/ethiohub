import express from "express";
import Listing from "../models/Listing.js";
import TransportationRequest from "../models/TransportationRequest.js";
import { sendEmail } from "../utils/sendEmail.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      pickupAddress,
      deliveryAddress,
      requestedDate,
      requestedTime,
      cargoDetails,
      cargoPhotos,
      serviceType,
    } = req.body || {};

    const cleanedCustomerName = cleanText(customerName);
    const cleanedCustomerEmail = cleanText(customerEmail).toLowerCase();
    const cleanedCustomerPhone = cleanText(customerPhone);
    const cleanedPickupAddress = cleanText(pickupAddress);
    const cleanedDeliveryAddress = cleanText(deliveryAddress);
    const cleanedRequestedTime = cleanText(requestedTime);
    const cleanedCargoDetails = cleanText(cargoDetails);

    if (!listingId) {
      return res.status(400).json({
        message: "Transportation business is required.",
      });
    }

    if (!cleanedCustomerName) {
      return res.status(400).json({
        message: "Your name is required.",
      });
    }

    if (!cleanedCustomerPhone) {
      return res.status(400).json({
        message: "Your phone number is required.",
      });
    }

    if (!cleanedPickupAddress) {
      return res.status(400).json({
        message: "Pickup address is required.",
      });
    }

    if (!cleanedDeliveryAddress) {
      return res.status(400).json({
        message: "Delivery address is required.",
      });
    }

    if (!requestedDate) {
      return res.status(400).json({
        message: "Requested service date is required.",
      });
    }

    if (!cleanedCargoDetails) {
      return res.status(400).json({
        message: "Cargo details are required.",
      });
    }

    if (
      cleanedCustomerEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedCustomerEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    const parsedRequestedDate = new Date(requestedDate);

    if (Number.isNaN(parsedRequestedDate.getTime())) {
      return res.status(400).json({
        message: "Please enter a valid service date.",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (parsedRequestedDate < today) {
      return res.status(400).json({
        message: "Requested service date cannot be in the past.",
      });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
    }).populate("ownerId", "name email");

    if (!listing) {
      return res.status(404).json({
        message: "Transportation business not found.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This transportation business is not currently accepting quote requests.",
      });
    }

    const allowedServiceTypes = [
      "Furniture Delivery",
      "Package Delivery",
      "Moving Service",
      "Airport Transportation",
      "Freight Delivery",
      "Other",
    ];

    const selectedServiceType = allowedServiceTypes.includes(serviceType)
      ? serviceType
      : "Other";

    const sanitizedCargoPhotos = Array.isArray(cargoPhotos)
      ? cargoPhotos
          .filter((url) => typeof url === "string" && url.trim())
          .map((url) => url.trim())
          .slice(0, 5)
      : [];

    const request = await TransportationRequest.create({
      listingId: listing._id,
      ownerId: listing.ownerId._id,

      customerName: cleanedCustomerName,
      customerEmail: cleanedCustomerEmail,
      customerPhone: cleanedCustomerPhone,

      pickupAddress: cleanedPickupAddress,
      deliveryAddress: cleanedDeliveryAddress,

      requestedDate: parsedRequestedDate,
      requestedTime: cleanedRequestedTime,

      cargoDetails: cleanedCargoDetails,
      cargoPhotos: sanitizedCargoPhotos,
      serviceType: selectedServiceType,

      status: "New",
    });

    const ownerEmail = listing.ownerId.email;

    if (ownerEmail) {
      try {
        await sendEmail({
          to: ownerEmail,
          subject: `New transportation quote request: ${listing.title}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
              <h1 style="color:#0f172a;">New Transportation Request</h1>

              <p>
                You received a new quote request for
                <strong>${escapeHtml(listing.title)}</strong>.
              </p>

              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin:24px 0;">
                <p><strong>Customer:</strong> ${escapeHtml(cleanedCustomerName)}</p>
                <p><strong>Phone:</strong> ${escapeHtml(cleanedCustomerPhone)}</p>
                <p><strong>Email:</strong> ${
                  cleanedCustomerEmail
                    ? escapeHtml(cleanedCustomerEmail)
                    : "Not provided"
                }</p>
                <p><strong>Service:</strong> ${escapeHtml(selectedServiceType)}</p>
                <p><strong>Pickup:</strong> ${escapeHtml(cleanedPickupAddress)}</p>
                <p><strong>Delivery:</strong> ${escapeHtml(cleanedDeliveryAddress)}</p>
                <p><strong>Date:</strong> ${escapeHtml(
                  parsedRequestedDate.toLocaleDateString()
                )}</p>
                <p><strong>Time:</strong> ${
                  cleanedRequestedTime
                    ? escapeHtml(cleanedRequestedTime)
                    : "Not specified"
                }</p>
                <p><strong>Cargo details:</strong><br/>${escapeHtml(
                  cleanedCargoDetails
                ).replaceAll("\n", "<br/>")}</p>
              </div>

              <div style="text-align:center;margin:30px 0;">
                <a
                  href="https://www.hubethio.com/owner/dashboard"
                  style="background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:8px;display:inline-block;font-weight:bold;"
                >
                  View Request in Owner Dashboard
                </a>
              </div>

              <p style="color:#6b7280;">
                — HubEthio Team
              </p>
            </div>
          `,
        });

        request.ownerEmailSentAt = new Date();
        await request.save();
      } catch (emailError) {
        console.error(
          "Transportation request owner email failed:",
          emailError
        );
      }
    }

    res.status(201).json({
      message:
        "Your transportation quote request was submitted successfully.",
      requestId: request._id,
    });
  } catch (err) {
    console.error("Create transportation request failed:", err);

    res.status(500).json({
      message: "Failed to submit transportation quote request.",
    });
  }
});

router.get("/owner", requireOwner, async (req, res) => {
  try {
    const requests = await TransportationRequest.find({
      ownerId: req.owner.id,
    })
      .populate(
        "listingId",
        "title city state subcategory imageUrl logoUrl"
      )
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error("Load owner transportation requests failed:", err);

    res.status(500).json({
      message: "Failed to load transportation requests.",
    });
  }
});

export default router;