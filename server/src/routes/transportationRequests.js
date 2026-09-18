import express from "express";
import mongoose from "mongoose";
import Listing from "../models/Listing.js";
import TransportationRequest from "../models/TransportationRequest.js";
import TransportationDriver from "../models/TransportationDriver.js";
import { sendEmail } from "../utils/sendEmail.js";
import { sendTransportationStatusEmail } from "../utils/sendTransportationStatusEmail.js";
import { autoDispatchTransportationDriver } from "../utils/autoDispatchTransportationDriver.js";
import { sendTransportationDriverAssignmentEmail } from "../utils/sendTransportationDriverAssignmentEmail.js";
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

    const requestedTimeText = cleanedRequestedTime
      ? new Date(`2000-01-01T${cleanedRequestedTime}:00`).toLocaleTimeString(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        )
      : "";

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

    if (
  typeof listingId !== "string" ||
  !mongoose.Types.ObjectId.isValid(
    listingId.trim()
  )
) {
  return res.status(400).json({
    message: "Invalid listing ID.",
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

    const requestedDateParts = String(requestedDate)
      .split("-")
      .map(Number);

    const parsedRequestedDate =
      requestedDateParts.length === 3
        ? new Date(
            requestedDateParts[0],
            requestedDateParts[1] - 1,
            requestedDateParts[2]
          )
        : new Date(NaN);

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
            <div style="margin:0;padding:24px;background:#f1f5f9;font-family:Arial,sans-serif;color:#0f172a;">
              <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;">

                <div style="background:#0f172a;padding:24px 28px;">
                  <div style="font-size:13px;font-weight:700;letter-spacing:1px;color:#f59e0b;text-transform:uppercase;">
                    HubEthio Transportation
                  </div>
                  <h1 style="margin:8px 0 0;font-size:26px;line-height:1.3;color:#ffffff;">
                    New Quote Request
                  </h1>
                </div>

                <div style="padding:28px;">
                  <p style="margin:0 0 22px;font-size:16px;line-height:1.6;color:#475569;">
                    You received a new transportation request for
                    <strong style="color:#0f172a;">${escapeHtml(listing.title)}</strong>.
                  </p>

                  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:12px;padding:16px 18px;margin-bottom:24px;">
                    <div style="font-size:12px;color:#9a3412;font-weight:700;text-transform:uppercase;">
                      Requested Service
                    </div>
                    <div style="margin-top:5px;font-size:18px;font-weight:700;color:#0f172a;">
                      ${escapeHtml(selectedServiceType)}
                    </div>
                    <div style="margin-top:6px;font-size:14px;color:#475569;">
                      ${escapeHtml(parsedRequestedDate.toLocaleDateString())}
                      ${requestedTimeText ? ` • ${escapeHtml(requestedTimeText)}` : ""}
                    </div>
                  </div>

                  <h2 style="font-size:16px;margin:0 0 10px;color:#0f172a;">
                    Customer
                  </h2>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:22px;line-height:1.8;">
                    <div><strong>Name:</strong> ${escapeHtml(cleanedCustomerName)}</div>
                    <div><strong>Phone:</strong> ${escapeHtml(cleanedCustomerPhone)}</div>
                    <div><strong>Email:</strong> ${
                      cleanedCustomerEmail
                        ? escapeHtml(cleanedCustomerEmail)
                        : "Not provided"
                    }</div>
                  </div>

                  <h2 style="font-size:16px;margin:0 0 10px;color:#0f172a;">
                    Trip Details
                  </h2>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:22px;line-height:1.8;">
                    <div><strong>Pickup:</strong> ${escapeHtml(cleanedPickupAddress)}</div>
                    <div><strong>Delivery:</strong> ${escapeHtml(cleanedDeliveryAddress)}</div>
                    <div><strong>Date:</strong> ${escapeHtml(
                      parsedRequestedDate.toLocaleDateString()
                    )}</div>
                    <div><strong>Time:</strong> ${
                      requestedTimeText
                        ? escapeHtml(requestedTimeText)
                        : "Not specified"
                    }</div>
                  </div>

                  <h2 style="font-size:16px;margin:0 0 10px;color:#0f172a;">
                    Request Details
                  </h2>
                  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:28px;line-height:1.8;">
                    ${escapeHtml(cleanedCargoDetails).replaceAll("\n", "<br/>")}
                  </div>

                  <div style="text-align:center;">
                    <a
                      href="${process.env.CLIENT_ORIGIN}/owner/transportation"
                      style="background:#f59e0b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:9px;display:inline-block;font-size:15px;font-weight:700;"
                    >
                      View Request in Transportation Dashboard
                    </a>
                  </div>
                </div>

                <div style="border-top:1px solid #e2e8f0;padding:18px 28px;text-align:center;font-size:13px;line-height:1.6;color:#64748b;">
                  This notification was sent because a customer requested a transportation quote from your business on HubEthio.
                  <br/>
                  <strong style="color:#475569;">HubEthio</strong>
                </div>

              </div>
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
      .select(
        "_id listingId customerName customerEmail customerPhone " +
          "pickupAddress deliveryAddress requestedDate requestedTime " +
          "cargoDetails cargoPhotos serviceType status quoteAmount " +
          "estimatedArrival ownerNotes quotedAt customerRespondedAt " +
          "inProgressAt completedAt cancelledAt driverId driverName " +
          "driverPhone vehicleDescription licensePlate driverAssignedAt " +
          "createdAt updatedAt"
      )
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

createdAt: request.createdAt,
quotedAt: request.quotedAt,
customerRespondedAt: request.customerRespondedAt,
inProgressAt: request.inProgressAt,
completedAt: request.completedAt,
cancelledAt: request.cancelledAt,

driverName: request.driverName,
driverPhone: request.driverPhone,
vehicleDescription: request.vehicleDescription,
licensePlate: request.licensePlate,
driverAssignedAt: request.driverAssignedAt,
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
  driverId,
  driverName,
  driverPhone,
  vehicleDescription,
  licensePlate,
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

if (!existingRequest) {
  return res.status(404).json({
    message: "Transportation request not found.",
  });
}

// Prevent invalid workflow transitions

if (
  status === "In Progress" &&
  existingRequest.status !== "Accepted"
) {
  return res.status(400).json({
    message:
      "Customer must accept the quote before transportation can begin.",
  });
}

if (
  status === "Completed" &&
  existingRequest.status !== "In Progress"
) {
  return res.status(400).json({
    message:
      "Transportation must be In Progress before it can be completed.",
  });
}

if (
  status === "Quoted" &&
  existingRequest.customerRespondedAt
) {
  return res.status(400).json({
    message:
      "The customer has already responded. The quote cannot be modified.",
  });
}

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

    if (status === "In Progress") {
  let assignedDriver = null;

  if (driverId) {
    if (
      typeof driverId !== "string" ||
      !mongoose.Types.ObjectId.isValid(driverId.trim())
    ) {
      return res.status(400).json({
        message: "Valid transportation driver ID is required.",
      });
    }

    assignedDriver = await TransportationDriver.findOne({
      _id: driverId.trim(),
      ownerId: req.owner.id,
      businessListingId: existingRequest.listingId,
    });

    if (!assignedDriver) {
      return res.status(404).json({
        message: "Transportation driver not found for this business.",
      });
    }

    if (
      assignedDriver.status !== "active" ||
      assignedDriver.verificationStatus !== "approved"
    ) {
      return res.status(400).json({
        message:
          "Transportation driver must be active and approved before assignment.",
      });
    }
  }

  if (!existingRequest.inProgressAt) {
    updateData.inProgressAt = new Date();
  }

  if (assignedDriver) {
    updateData.driverId = assignedDriver._id;
    updateData.driverName = assignedDriver.fullName;
    updateData.driverPhone = assignedDriver.phone;
  } else {
    updateData.driverName = driverName || "";
    updateData.driverPhone = driverPhone || "";
  }

  updateData.vehicleDescription =
    vehicleDescription || "";
  updateData.licensePlate =
    licensePlate || "";

  if (!existingRequest.driverAssignedAt) {
    updateData.driverAssignedAt = new Date();
  }
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

const trackingStatuses = [
  "Accepted",
  "In Progress",
  "Completed",
  "Cancelled",
];

if (trackingStatuses.includes(status)) {
  const tokenIsStillValid =
    existingRequest.quoteAccessToken &&
    existingRequest.quoteAccessTokenExpiresAt &&
    existingRequest.quoteAccessTokenExpiresAt > new Date();

  if (!tokenIsStillValid) {
    updateData.quoteAccessToken =
      crypto.randomBytes(32).toString("hex");

    updateData.quoteAccessTokenExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    );
  }
}

    const request = await TransportationRequest.findOneAndUpdate(
  {
    _id: req.params.id,
    ownerId: req.owner.id,
  },
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

    if (
      statusChanged &&
      request.status === "In Progress" &&
      request.driverId
    ) {
      try {
        await TransportationDriver.updateOne(
          {
            _id: request.driverId,
            availabilityStatus: "available",
          },
          {
            $set: {
              availabilityStatus: "busy",
            },
          }
        );
      } catch (err) {
        console.error(
          "Transportation driver busy update failed:",
          err
        );
      }
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
    await sendTransportationStatusEmail(request);
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

    const customerRespondedAt = new Date();

    const responseClaim =
      await TransportationRequest.updateOne(
        {
          _id: request._id,
          customerRespondedAt: null,
        },
        {
          $set: {
            status: decision,
            customerRespondedAt,
          },
        }
      );

    if (responseClaim.modifiedCount !== 1) {
      return res.status(400).json({
        message:
          "This transportation quote has already been responded to.",
      });
    }

    request.status = decision;
    request.customerRespondedAt = customerRespondedAt;

    let automaticallyAssignedDriver = null;

    if (decision === "Accepted") {
      try {
        automaticallyAssignedDriver =
          await autoDispatchTransportationDriver(request);

        if (automaticallyAssignedDriver) {
          try {
            await sendTransportationDriverAssignmentEmail(
              request,
              automaticallyAssignedDriver
            );
          } catch (emailError) {
            console.error(
              "Transportation driver assignment email failed:",
              emailError
            );
          }
        }
      } catch (dispatchError) {
        console.error(
          "Automatic transportation driver dispatch failed:",
          dispatchError
        );
      }
    }

    if (request.ownerId) {
      try {

    const listing = await Listing.findById(request.listingId)
          .populate("ownerId", "email name");

        if (listing?.ownerId?.email) {
          const emailResult = await sendEmail({
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

                ${
                  decision === "Accepted" &&
                  !automaticallyAssignedDriver
                    ? `
                      <div style="background:#fff3cd;padding:16px;border-radius:8px;margin:20px 0;">
                        <strong>Driver assignment needed</strong>
                        <p style="margin-bottom:0;">
                          No eligible available driver was found automatically.
                          Please open your Transportation Dashboard and assign a driver manually.
                        </p>
                      </div>
                    `
                    : ""
                }

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

          if (
            emailResult &&
            decision === "Accepted" &&
            !automaticallyAssignedDriver
          ) {
            request.dispatchFallbackEmailSentAt = new Date();
            await request.save();
          }
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
