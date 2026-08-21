import express from "express";
import crypto from "crypto";

import CargoShippingRequest from "../models/CargoShippingRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/*
  PUBLIC
  Create Cargo & Shipping request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      originCountry,
      originCity,
      originState,
      destinationCity,
      destinationCountry,
      itemDescription,
      packageCount,
      estimatedWeight,
      weightUnit,
      dimensions,
      pickupRequired,
      desiredShippingDate,
      customsAssistanceNeeded,
      preferredContactMethod,
      message,
    } = req.body || {};

    if (!listingId) {
      return res.status(400).json({
        message: "Listing is required.",
      });
    }

    if (
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !itemDescription
    ) {
      return res.status(400).json({
        message:
          "Name, email, phone, and shipment description are required.",
      });
    }

    const listing = await Listing.findOne({
      _id: listingId,
      status: "approved",
    }).populate("categoryId");

    if (!listing) {
      return res.status(404).json({
        message:
          "Cargo & Shipping business could not be found.",
      });
    }

    if (
      listing.categoryId?.slug !==
      "cargo-shipping-to-ethiopia"
    ) {
      return res.status(400).json({
        message:
          "This listing does not support Cargo & Shipping requests.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This Cargo & Shipping business is not currently accepting requests.",
      });
    }

    const request =
      await CargoShippingRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId,

        customerName:
          String(customerName).trim(),

        customerEmail:
          String(customerEmail)
            .trim()
            .toLowerCase(),

        customerPhone:
          String(customerPhone).trim(),

        serviceType:
          serviceType || "Other",

        originCountry:
          originCountry ||
          "United States",

        originCity:
          String(originCity || "").trim(),

        originState:
          String(originState || "").trim(),

        destinationCity:
          String(
            destinationCity || ""
          ).trim(),

        destinationCountry:
          destinationCountry ||
          "Ethiopia",

        itemDescription:
          String(itemDescription).trim(),

        packageCount:
          packageCount === "" ||
          packageCount == null
            ? 1
            : Number(packageCount),

        estimatedWeight:
          estimatedWeight === "" ||
          estimatedWeight == null
            ? null
            : Number(estimatedWeight),

        weightUnit:
          weightUnit || "lb",

        dimensions:
          String(dimensions || "").trim(),

        pickupRequired:
          Boolean(pickupRequired),

        desiredShippingDate:
          String(
            desiredShippingDate || ""
          ),

        customsAssistanceNeeded:
          Boolean(
            customsAssistanceNeeded
          ),

        preferredContactMethod:
          preferredContactMethod ||
          "Either",

        message:
          String(message || "").trim(),
      });

    await request.populate(
      "listingId",
      "title city state"
    );

    return res.status(201).json({
      message:
        "Cargo & Shipping request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Cargo & Shipping request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Cargo & Shipping request.",
    });
  }
});

/*
  OWNER
  Load owned Cargo & Shipping requests
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
        await CargoShippingRequest.find({
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
        "Load owner Cargo & Shipping requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Cargo & Shipping requests.",
      });
    }
  }
);

/*
  PUBLIC
  Get Cargo & Shipping quote by secure token
*/
router.get(
  "/quote/:token",
  async (req, res) => {
    try {
      const token = String(
        req.params.token || ""
      ).trim();

      if (
        !token ||
        !/^[a-f0-9]{64}$/i.test(token)
      ) {
        return res.status(400).json({
          message:
            "This Cargo & Shipping quote link is invalid.",
        });
      }

      const request =
        await CargoShippingRequest.findOne({
          quoteAccessToken: token,
        }).populate(
          "listingId",
          "title"
        );

      if (!request) {
        return res.status(404).json({
          message:
            "This Cargo & Shipping quote could not be found.",
        });
      }

      if (
        !request.quoteAccessTokenExpiresAt ||
        request.quoteAccessTokenExpiresAt <
          new Date()
      ) {
        return res.status(410).json({
          message:
            "This Cargo & Shipping quote link has expired.",
        });
      }

      return res.json({
        id: request._id,

        businessName:
          request.listingId?.title ||
          "Cargo & Shipping Provider",

        customerName:
          request.customerName,

        serviceType:
          request.serviceType,

        originCountry:
          request.originCountry,

        originCity:
          request.originCity,

        originState:
          request.originState,

        destinationCity:
          request.destinationCity,

        destinationCountry:
          request.destinationCountry,

        itemDescription:
          request.itemDescription,

        packageCount:
          request.packageCount,

        estimatedWeight:
          request.estimatedWeight,

        weightUnit:
          request.weightUnit,

        dimensions:
          request.dimensions,

        pickupRequired:
          request.pickupRequired,

        desiredShippingDate:
          request.desiredShippingDate,

        customsAssistanceNeeded:
          request.customsAssistanceNeeded,

        quoteAmount:
          request.quoteAmount,

        quoteNotes:
          request.quoteNotes,

        status:
          request.status,

        createdAt:
          request.createdAt,

        quotedAt:
          request.quotedAt,

        customerRespondedAt:
          request.customerRespondedAt,
      });
    } catch (err) {
      console.error(
        "Load Cargo & Shipping quote error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Cargo & Shipping quote.",
      });
    }
  }
);

/*
  PUBLIC
  Customer responds to Cargo & Shipping quote
*/
router.patch(
  "/quote/:token/respond",
  async (req, res) => {
    try {
      const token = String(
        req.params.token || ""
      ).trim();

      const { decision } = req.body || {};

      if (
        !token ||
        !/^[a-f0-9]{64}$/i.test(token)
      ) {
        return res.status(400).json({
          message:
            "This Cargo & Shipping quote link is invalid.",
        });
      }

      if (
        !["Accepted", "Declined"].includes(
          decision
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid Cargo & Shipping quote response.",
        });
      }

      const request =
        await CargoShippingRequest.findOne({
          quoteAccessToken: token,
        }).populate(
          "listingId",
          "title"
        );

      if (!request) {
        return res.status(404).json({
          message:
            "This Cargo & Shipping quote could not be found.",
        });
      }

      if (
        !request.quoteAccessTokenExpiresAt ||
        request.quoteAccessTokenExpiresAt <
          new Date()
      ) {
        return res.status(410).json({
          message:
            "This Cargo & Shipping quote has expired.",
        });
      }

      if (request.customerRespondedAt) {
        return res.status(400).json({
          message:
            "This Cargo & Shipping quote has already been responded to.",
        });
      }

      request.status = decision;
      request.customerRespondedAt =
        new Date();

      if (decision === "Accepted") {
        request.acceptedAt =
          request.customerRespondedAt;
      }

      if (decision === "Declined") {
        request.declinedAt =
          request.customerRespondedAt;
      }

      await request.save();

      return res.json({
        message:
          decision === "Accepted"
            ? "Cargo & Shipping quote accepted successfully."
            : "Cargo & Shipping quote declined successfully.",

        request: {
          id: request._id,

          businessName:
            request.listingId?.title ||
            "Cargo & Shipping Provider",

          customerName:
            request.customerName,

          serviceType:
            request.serviceType,

          quoteAmount:
            request.quoteAmount,

          quoteNotes:
            request.quoteNotes,

          status:
            request.status,

          customerRespondedAt:
            request.customerRespondedAt,
        },
      });
    } catch (err) {
      console.error(
        "Cargo & Shipping quote response error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to submit Cargo & Shipping quote response.",
      });
    }
  }
);

/*
  OWNER
  Update Cargo & Shipping request status
*/
router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const {
        status,
        quoteAmount = null,
        quoteNotes = "",
        ownerNotes = "",
      } = req.body || {};

      const allowedStatuses = [
        "New",
        "Reviewing",
        "Quoted",
        "Accepted",
        "Cargo Received",
        "In Transit",
        "Arrived",
        "Completed",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Cargo & Shipping request status.",
        });
      }

      const request =
        await CargoShippingRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Cargo & Shipping request not found.",
        });
      }

      request.status = status;

      request.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

      if (status === "Reviewing") {
        request.reviewingAt = now;
      }

      if (status === "Quoted") {
  request.quoteAmount =
    quoteAmount === null ||
    quoteAmount === ""
      ? null
      : Number(quoteAmount);

  request.quoteNotes =
    String(quoteNotes || "").trim();

  request.quotedAt = now;

  const tokenIsStillValid =
    request.quoteAccessToken &&
    request.quoteAccessTokenExpiresAt &&
    request.quoteAccessTokenExpiresAt >
      new Date();

  if (!tokenIsStillValid) {
    request.quoteAccessToken =
      crypto.randomBytes(32).toString("hex");

    request.quoteAccessTokenExpiresAt =
      new Date(
        Date.now() +
          30 * 24 * 60 * 60 * 1000
      );
  }
}

      if (status === "Accepted") {
        request.acceptedAt = now;
      }

      if (status === "Cargo Received") {
        request.cargoReceivedAt = now;
      }

      if (status === "In Transit") {
        request.inTransitAt = now;
      }

      if (status === "Arrived") {
        request.arrivedAt = now;
      }

      if (status === "Completed") {
        request.completedAt = now;
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

      if (
  status === "Cargo Received" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Cargo & Shipping Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Cargo Has Been Received: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f4f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:34px 28px;
              text-align:center;
              background:linear-gradient(
                135deg,
                #1d4ed8,
                #3b82f6
              );
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                📦
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Cargo Has Been Received
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has received your
                cargo and it is now being prepared for
                shipment.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:14px;
              ">
                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Shipment:</strong>
                  ${request.itemDescription}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Packages:</strong>
                  ${request.packageCount || 1}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Status:</strong>
                  Cargo Received
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                You will receive another update when
                your shipment is in transit.
              </p>

              <p style="
                margin-top:24px;
                font-size:15px;
              ">
                — The HubEthio Team
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Cargo Received email failed:",
      emailErr
    );
  }
}

if (
  status === "In Transit" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Cargo & Shipping Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Cargo Is In Transit: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f4f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:34px 28px;
              text-align:center;
              background:linear-gradient(
                135deg,
                #0f766e,
                #14b8a6
              );
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                ✈️
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Cargo Is In Transit
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Your cargo with ${businessTitle}
                is now in transit to its destination.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#f0fdfa;
                border:1px solid #99f6e4;
                border-radius:14px;
              ">
                <p style="margin:6px 0;font-size:14px;">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Shipment:</strong>
                  ${request.itemDescription}
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Destination:</strong>
                  ${
                    [
                      request.destinationCity,
                      request.destinationCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "Not specified"
                  }
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Status:</strong>
                  In Transit
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                You will receive another update when
                the shipment arrives.
              </p>

              <p style="
                margin-top:24px;
                font-size:15px;
              ">
                — The HubEthio Team
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Cargo In Transit email failed:",
      emailErr
    );
  }
}

if (
  status === "Arrived" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Cargo & Shipping Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Cargo Has Arrived: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f4f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:34px 28px;
              text-align:center;
              background:linear-gradient(
                135deg,
                #16a34a,
                #22c55e
              );
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                ✅
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Cargo Has Arrived
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Good news — your cargo with
                ${businessTitle} has arrived at its
                destination.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#f0fdf4;
                border:1px solid #bbf7d0;
                border-radius:14px;
              ">
                <p style="margin:6px 0;font-size:14px;">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Shipment:</strong>
                  ${request.itemDescription}
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Destination:</strong>
                  ${
                    [
                      request.destinationCity,
                      request.destinationCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "Not specified"
                  }
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Status:</strong>
                  Arrived
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Please contact the shipping provider
                directly for pickup, delivery, customs,
                or final-release instructions.
              </p>

              <p style="
                margin-top:24px;
                font-size:15px;
              ">
                — The HubEthio Team
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Cargo Arrived email failed:",
      emailErr
    );
  }
}

if (
  status === "Completed" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Cargo & Shipping Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Cargo & Shipping Service Is Complete: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f4f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:34px 28px;
              text-align:center;
              background:linear-gradient(
                135deg,
                #7c3aed,
                #8b5cf6
              );
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                🎉
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Cargo & Shipping Service Is Complete
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Your Cargo & Shipping request with
                ${businessTitle} has been marked
                completed.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#faf5ff;
                border:1px solid #ddd6fe;
                border-radius:14px;
              ">
                <p style="margin:6px 0;font-size:14px;">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Shipment:</strong>
                  ${request.itemDescription}
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Destination:</strong>
                  ${
                    [
                      request.destinationCity,
                      request.destinationCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "Not specified"
                  }
                </p>

                <p style="margin:6px 0;font-size:14px;">
                  <strong>Status:</strong>
                  Completed
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Thank you for using HubEthio to connect
                with ${businessTitle}. Please contact
                the business directly if you have any
                final questions about your shipment.
              </p>

              <p style="
                margin-top:24px;
                font-size:15px;
              ">
                — The HubEthio Team
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Cargo Completed email failed:",
      emailErr
    );
  }
}

      if (
  status === "Quoted" &&
  request.customerEmail &&
  request.quoteAccessToken
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Cargo & Shipping Services";

    const quoteUrl =
      `${
        process.env.CLIENT_ORIGIN ||
        process.env.CLIENT_URL ||
        "https://www.hubethio.com"
      }/cargo-shipping-quote/${request.quoteAccessToken}`;

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Cargo & Shipping Quote Is Ready: ${businessTitle}`,

      html: `
        <div style="
          margin:0;
          padding:32px 16px;
          background:#f4f7fb;
          font-family:Arial,Helvetica,sans-serif;
          color:#1f2937;
        ">
          <div style="
            max-width:620px;
            margin:0 auto;
            background:#ffffff;
            border-radius:20px;
            overflow:hidden;
            box-shadow:0 10px 30px rgba(0,0,0,0.08);
          ">
            <div style="
              padding:34px 28px;
              text-align:center;
              background:linear-gradient(
                135deg,
                #1d4ed8,
                #3b82f6
              );
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                📦
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Cargo & Shipping Quote Is Ready
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
              ">
                ${businessTitle}
              </p>
            </div>

            <div style="padding:30px 28px;">
              <p style="
                margin-top:0;
                font-size:17px;
              ">
                Hello ${request.customerName},
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has prepared a quote
                for your Cargo & Shipping request.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:14px;
              ">
                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Shipment:</strong>
                  ${request.itemDescription}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Packages:</strong>
                  ${request.packageCount || 1}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Destination:</strong>
                  ${
                    [
                      request.destinationCity,
                      request.destinationCountry,
                    ]
                      .filter(Boolean)
                      .join(", ") ||
                    "Not specified"
                  }
                </p>

                <p style="
                  margin:6px 0;
                  font-size:18px;
                  font-weight:800;
                  color:#0f172a;
                ">
                  <strong>Quote:</strong>
                  $${Number(
                    request.quoteAmount || 0
                  ).toFixed(2)}
                </p>
              </div>

              ${
                request.quoteNotes
                  ? `
                    <div style="
                      margin:22px 0;
                      padding:18px;
                      background:#f8fafc;
                      border:1px solid #e2e8f0;
                      border-radius:14px;
                    ">
                      <strong>
                        Quote Notes
                      </strong>

                      <p style="
                        margin:8px 0 0;
                        line-height:1.7;
                        color:#475569;
                      ">
                        ${request.quoteNotes}
                      </p>
                    </div>
                  `
                  : ""
              }

              <div style="
                text-align:center;
                margin:30px 0;
              ">
                <a
                  href="${quoteUrl}"
                  style="
                    display:inline-block;
                    padding:14px 24px;
                    border-radius:12px;
                    background:#1d4ed8;
                    color:#ffffff;
                    text-decoration:none;
                    font-weight:800;
                  "
                >
                  View & Respond to Quote
                </a>
              </div>

              <p style="
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                This secure quote link is valid for
                30 days. You can review the quote and
                choose to accept or decline it.
              </p>

              <p style="
                margin-top:24px;
                font-size:15px;
              ">
                — The HubEthio Team
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Cargo & Shipping quote email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Cargo & Shipping request status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Cargo & Shipping request status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Cargo & Shipping request status.",
      });
    }
  }
);

export default router;