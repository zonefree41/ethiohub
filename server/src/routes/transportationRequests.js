import express from "express";
import Listing from "../models/Listing.js";
import TransportationRequest from "../models/TransportationRequest.js";
import { sendEmail } from "../utils/sendEmail.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import crypto from "crypto";

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
      .sort({ createdAt: -1 })
      .populate("listingId", "title");

    res.json(requests);
  } catch (error) {
    console.error("Load owner requests failed:", error);

    res.status(500).json({
      message: "Failed to load transportation requests.",
    });
  }
});

router.get("/quote/:token", async (req, res) => {
  try {
    const token = cleanText(req.params.token);

    if (!token || !/^[a-f0-9]{64}$/i.test(token)) {
      return res.status(400).json({
        message: "This transportation quote link is invalid.",
      });
    }

    const request = await TransportationRequest.findOne({
      quoteAccessToken: token,
    }).populate("listingId", "title");

    if (!request) {
      return res.status(404).json({
        message:
          "This transportation quote could not be found.",
      });
    }

    if (
      !request.quoteAccessTokenExpiresAt ||
      request.quoteAccessTokenExpiresAt < new Date()
    ) {
      return res.status(410).json({
        message:
          "This transportation quote link has expired.",
      });
    }

    res.json({
      id: request._id,

      businessName:
        request.listingId?.title ||
        "Transportation Provider",

      customerName: request.customerName,
      serviceType: request.serviceType,

      pickupAddress: request.pickupAddress,
      deliveryAddress: request.deliveryAddress,

      requestedDate: request.requestedDate,
      requestedTime: request.requestedTime,

      cargoDetails: request.cargoDetails,

      quoteAmount: request.quoteAmount,
      estimatedArrival: request.estimatedArrival,
      ownerNotes: request.ownerNotes,

      status: request.status,
      quotedAt: request.quotedAt,
    });
  } catch (error) {
    console.error(
      "Load transportation quote failed:",
      error
    );

    res.status(500).json({
      message:
        "Failed to load transportation quote.",
    });
  }
});

router.patch("/:id/status", requireOwner, async (req, res) => {
  try {
    const {
      status,
      quoteAmount,
      estimatedArrival,
      ownerNotes,
    } = req.body;

    const allowedStatuses = [
      "New",
      "Quoted",
      "Accepted",
      "In Progress",
      "Completed",
      "Cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status.",
      });
    }

    const existingRequest = await TransportationRequest.findOne({
  _id: req.params.id,
  ownerId: req.owner.id,
});

if (
  existingRequest.customerRespondedAt &&
  status === "Quoted"
) {
  return res.status(400).json({
    message:
      "This quote has already been accepted or declined and can no longer be modified.",
  });
}

if (!existingRequest) {
  return res.status(404).json({
    message: "Transportation request not found.",
  });
}

const previousStatus = existingRequest.status;

const statusChanged =
  previousStatus !== status;

    const updateData = {
      status,
    };

    if (
  status === "In Progress" &&
  !existingRequest.inProgressAt
) {
  updateData.inProgressAt = new Date();
}

if (
  status === "Completed" &&
  !existingRequest.completedAt
) {
  updateData.completedAt = new Date();
}

if (
  status === "Cancelled" &&
  !existingRequest.cancelledAt
) {
  updateData.cancelledAt = new Date();
}

    if (status === "Quoted") {
  updateData.quoteAmount =
    quoteAmount !== "" && quoteAmount != null
      ? Number(quoteAmount)
      : null;

  updateData.estimatedArrival = estimatedArrival || "";
  updateData.ownerNotes = ownerNotes || "";
  updateData.quotedAt = new Date();

  const tokenIsStillValid =
    existingRequest.quoteAccessToken &&
    existingRequest.quoteAccessTokenExpiresAt &&
    existingRequest.quoteAccessTokenExpiresAt > new Date();

  if (tokenIsStillValid) {
    updateData.quoteAccessToken =
      existingRequest.quoteAccessToken;

    updateData.quoteAccessTokenExpiresAt =
      existingRequest.quoteAccessTokenExpiresAt;
  } else {
    updateData.quoteAccessToken =
      crypto.randomBytes(32).toString("hex");

    updateData.quoteAccessTokenExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
  }
}

    const request = await TransportationRequest.findByIdAndUpdate(
  req.params.id,
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );

    if (!request) {
      return res.status(404).json({
        message: "Transportation request not found.",
      });
    }

    const quoteUrl =
  `${process.env.CLIENT_ORIGIN}/transportation-quote/` +
  request.quoteAccessToken;

    if (
  status === "Quoted" &&
  request.customerEmail &&
  request.quoteAccessToken
) {
  try {
    await sendEmail({
      to: request.customerEmail,
      subject: "🚚 Your HubEthio Transportation Quote Is Ready",
      html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">

        <h2 style="color:#f59e0b;">
          Your Transportation Quote Is Ready
        </h2>

        <p>Hello ${escapeHtml(request.customerName)},</p>

        <p>
          A transportation provider has prepared your quote.
        </p>

        <table
          style="width:100%;border-collapse:collapse;margin:25px 0;"
        >
          <tr>
            <td><strong>Quote Amount</strong></td>
            <td>$${request.quoteAmount}</td>
          </tr>

          <tr>
            <td><strong>Estimated Arrival</strong></td>
            <td>${escapeHtml(request.estimatedArrival)}</td>
          </tr>

          <tr>
            <td><strong>Notes</strong></td>
            <td>${escapeHtml(request.ownerNotes)}</td>
          </tr>
        </table>

        <div style="text-align:center;margin:35px 0;">

          <a
            href="${quoteUrl}"
            style="
              background:#f59e0b;
              color:white;
              padding:15px 28px;
              border-radius:8px;
              text-decoration:none;
              font-weight:bold;
            "
          >
            View My Quote
          </a>

        </div>

        <p>
          This secure link expires in 30 days.
        </p>

      </div>
      `,
    });

    request.customerQuoteEmailSentAt = new Date();
    await request.save();
  } catch (err) {
    console.error(
      "Customer quote email failed:",
      err
    );
  }
}

if (
  statusChanged &&
  request.customerEmail &&
  ["In Progress", "Completed", "Cancelled"].includes(request.status)
) {
  try {
    let subject = "";
    let heading = "";
    let message = "";

    if (request.status === "In Progress") {
      subject = "🚚 Your HubEthio Transportation Is In Progress";
      heading = "Your Transportation Is In Progress";
      message =
        "Good news! Your transportation provider has started your request.";
    }

    if (request.status === "Completed") {
      subject = "✅ Your HubEthio Transportation Has Been Completed";
      heading = "Transportation Completed";
      message =
        "Your transportation request has been completed successfully. Thank you for choosing HubEthio.";
    }

    if (request.status === "Cancelled") {
      subject = "❌ Your HubEthio Transportation Has Been Cancelled";
      heading = "Transportation Cancelled";
      message =
        "Unfortunately, your transportation request has been cancelled. Please contact the transportation provider if you have any questions.";
    }

    await sendEmail({
      to: request.customerEmail,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">
          <h2 style="color:#f59e0b;">${heading}</h2>

          <p>Hello ${escapeHtml(request.customerName)},</p>

          <p>${message}</p>

          <table style="width:100%;border-collapse:collapse;margin:25px 0;">
            <tr>
              <td><strong>Status</strong></td>
              <td>${escapeHtml(request.status)}</td>
            </tr>

            <tr>
              <td><strong>Pickup</strong></td>
              <td>${escapeHtml(request.pickupAddress)}</td>
            </tr>

            <tr>
              <td><strong>Delivery</strong></td>
              <td>${escapeHtml(request.deliveryAddress)}</td>
            </tr>
          </table>

          <p>
            You can continue using your secure transportation tracking link to
            view the latest status.
          </p>

          ${request.quoteAccessToken ? `
  <div style="text-align:center;margin:35px 0;">
    <a
      href="${process.env.CLIENT_ORIGIN}/transportation-quote/${request.quoteAccessToken}"
      style="
        display:inline-block;
        background:#f59e0b;
        color:#ffffff;
        padding:15px 28px;
        border-radius:8px;
        text-decoration:none;
        font-weight:bold;
      "
    >
      View Transportation Status
    </a>
  </div>
` : ""}
        </div>
      `,
    });
  } catch (err) {
    console.error(
      "Transportation status email failed:",
      err
    );
  }
}

    res.json(request);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to update transportation request.",
    });
  }
});

router.patch("/quote/:token/respond", async (req, res) => {
  try {
    const token = cleanText(req.params.token);
    const { decision } = req.body || {};

    if (!["Accepted", "Declined"].includes(decision)) {
      return res.status(400).json({
        message: "Invalid response.",
      });
    }

    const request = await TransportationRequest.findOne({
      quoteAccessToken: token,
    }).populate("listingId", "title");

    if (!request) {
      return res.status(404).json({
        message: "Transportation quote not found.",
      });
    }

    if (
      !request.quoteAccessTokenExpiresAt ||
      request.quoteAccessTokenExpiresAt < new Date()
    ) {
      return res.status(410).json({
        message: "This transportation quote has expired.",
      });
    }

    if (request.customerRespondedAt) {
  return res.status(400).json({
    message:
      "This transportation quote has already been responded to.",
  });
}

    request.status = decision;
    request.customerRespondedAt = new Date();

    await request.save();

    if (request.ownerId) {
      try {
        const listing = await Listing.findById(request.listingId)
          .populate("ownerId", "email name");

        if (listing?.ownerId?.email) {
          await sendEmail({
            to: listing.ownerId.email,
            subject: `Customer ${decision} Your Transportation Quote`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">

                <h2 style="color:#f59e0b">
                  Customer Response Received
                </h2>

                <p>
                  The customer has
                  <strong>${decision}</strong>
                  your transportation quote.
                </p>

                <table style="width:100%;border-collapse:collapse;margin-top:25px">

  <tr>
    <td><strong>Business</strong></td>
    <td>${escapeHtml(request.listingId.title)}</td>
  </tr>

  <tr>
    <td><strong>Customer</strong></td>
    <td>${escapeHtml(request.customerName)}</td>
  </tr>

  <tr>
    <td><strong>Quote Amount</strong></td>
    <td>$${request.quoteAmount}</td>
  </tr>

  <tr>
    <td><strong>Status</strong></td>
    <td>${decision}</td>
  </tr>

</table>

                <p style="margin-top:30px">
  Log into your HubEthio Transportation Dashboard to
  continue managing this request.
</p>

<div style="text-align:center;margin:30px 0;">
  <a
    href="${process.env.CLIENT_ORIGIN}/owner/transportation"
    style="
      display:inline-block;
      background:#00843d;
      color:#ffffff;
      text-decoration:none;
      padding:14px 28px;
      border-radius:8px;
      font-weight:bold;
      font-size:16px;
    "
  >
    🚚 Open Transportation Dashboard
  </a>
</div>

<div style="text-align:center;margin:30px 0;">
  <a
    href="${process.env.CLIENT_ORIGIN}/owner/transportation"
    style="
      display:inline-block;
      background:#00843d;
      color:#ffffff;
      text-decoration:none;
      padding:14px 24px;
      border-radius:8px;
      font-weight:bold;
    "
  >
    Open Owner Dashboard
  </a>
</div>

              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error(
          "Owner response email failed:",
          emailError
        );
      }
    }

    res.json({
      businessName:
        request.listingId?.title ||
        "Transportation Provider",

      customerName: request.customerName,
      serviceType: request.serviceType,

      pickupAddress: request.pickupAddress,
      deliveryAddress: request.deliveryAddress,

      requestedDate: request.requestedDate,
      requestedTime: request.requestedTime,

      cargoDetails: request.cargoDetails,

      quoteAmount: request.quoteAmount,
      estimatedArrival: request.estimatedArrival,
      ownerNotes: request.ownerNotes,

      status: request.status,
      quotedAt: request.quotedAt,
    });
  } catch (error) {
    console.error(
      "Transportation quote response failed:",
      error
    );

    res.status(500).json({
      message: "Failed to submit response.",
    });
  }
});

export default router;