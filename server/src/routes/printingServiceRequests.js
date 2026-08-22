import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import PrintingServiceRequest from "../models/PrintingServiceRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/*
  PUBLIC
  Create Printing service request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      productType = "",
      quantity = 1,
      sizeSpecifications = "",
      colorOption = "",
      finishingOptions = "",
      neededByDate = "",
      fulfillmentMethod = "Either",
      preferredContactMethod = "Either",
      message = "",
    } = req.body || {};

    if (
      !listingId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !serviceType
    ) {
      return res.status(400).json({
        message:
          "Please provide all required Printing service request information.",
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

    const listing = await Listing.findById(
  listingId
)
  .populate(
    "ownerId",
    "name email"
  )
  .populate(
    "categoryId",
    "name_en slug"
  );

    if (!listing) {
      return res.status(404).json({
        message:
          "Printing & Promotional Services listing not found.",
      });
    }

    if (
  listing.categoryId?.slug !==
  "printing-promotional-services"
) {
  return res.status(400).json({
    message:
      "This listing is not a Printing & Promotional Services listing.",
  });
}

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Printing & Promotional Services listing is not currently accepting requests.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const request =
      await PrintingServiceRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId._id,
        customerName,
        customerEmail,
        customerPhone,
        serviceType,
        productType,
        quantity: Number(quantity) || 1,
        sizeSpecifications,
        colorOption,
        finishingOptions,
        neededByDate,
        fulfillmentMethod,
        preferredContactMethod,
        message,
      });

    return res.status(201).json({
      message:
        "Printing service request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Printing service request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Printing service request.",
    });
  }
});

/*
  OWNER
  Get Printing service requests for logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
        await PrintingServiceRequest.find({
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
        "Load Printing service requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Printing service requests.",
      });
    }
  }
);

/*
  PUBLIC
  Get Printing quote by secure token
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
            "This Printing quote link is invalid.",
        });
      }

      const request =
        await PrintingServiceRequest.findOne({
          quoteAccessToken: token,
        }).populate(
          "listingId",
          "title"
        );

      if (!request) {
        return res.status(404).json({
          message:
            "This Printing quote could not be found.",
        });
      }

      if (
        !request.quoteAccessTokenExpiresAt ||
        request.quoteAccessTokenExpiresAt <
          new Date()
      ) {
        return res.status(410).json({
          message:
            "This Printing quote link has expired.",
        });
      }

      return res.json({
        id: request._id,

        businessName:
          request.listingId?.title ||
          "Printing Provider",

        customerName:
          request.customerName,

        serviceType:
          request.serviceType,

        productType:
          request.productType,

        quantity:
          request.quantity,

        sizeSpecifications:
          request.sizeSpecifications,

        colorOption:
          request.colorOption,

        finishingOptions:
          request.finishingOptions,

        neededByDate:
          request.neededByDate,

        fulfillmentMethod:
          request.fulfillmentMethod,

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
        "Load Printing quote error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Printing quote.",
      });
    }
  }
);

/*
  PUBLIC
  Customer responds to Printing quote
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
            "This Printing quote link is invalid.",
        });
      }

      if (
        !["Accepted", "Declined"].includes(
          decision
        )
      ) {
        return res.status(400).json({
          message:
            "Invalid Printing quote response.",
        });
      }

      const request =
        await PrintingServiceRequest.findOne({
          quoteAccessToken: token,
        }).populate(
          "listingId",
          "title"
        );

      if (!request) {
        return res.status(404).json({
          message:
            "This Printing quote could not be found.",
        });
      }

      if (
        !request.quoteAccessTokenExpiresAt ||
        request.quoteAccessTokenExpiresAt <
          new Date()
      ) {
        return res.status(410).json({
          message:
            "This Printing quote has expired.",
        });
      }

      if (request.customerRespondedAt) {
        return res.status(400).json({
          message:
            "This Printing quote has already been responded to.",
        });
      }

      request.status =
        decision === "Accepted"
          ? "Approved"
          : "Declined";

      request.customerRespondedAt =
        new Date();

      if (decision === "Accepted") {
        request.approvedAt =
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
            ? "Printing quote accepted successfully."
            : "Printing quote declined successfully.",

        request: {
          id: request._id,

          businessName:
            request.listingId?.title ||
            "Printing Provider",

          customerName:
            request.customerName,

          serviceType:
            request.serviceType,

          productType:
            request.productType,

          quantity:
            request.quantity,

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
        "Printing quote response error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to submit Printing quote response.",
      });
    }
  }
);

/*
  OWNER
  Update Printing service request status
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
        "Quoted",
        "Approved",
        "In Production",
        "Ready",
        "Completed",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Printing service request status.",
        });
      }

      const request =
        await PrintingServiceRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Printing service request not found.",
        });
      }

      request.status = status;
      request.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

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

      if (status === "Approved") {
        request.approvedAt = now;
      }

      if (status === "In Production") {
        request.productionStartedAt = now;
      }

      if (status === "Ready") {
        request.readyAt = now;
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
  status === "Quoted" &&
  request.customerEmail &&
  request.quoteAccessToken
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Printing Services";

    const quoteUrl =
      `${
        process.env.CLIENT_ORIGIN ||
        process.env.CLIENT_URL ||
        "https://www.hubethio.com"
      }/printing-quote/${request.quoteAccessToken}`;

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Printing Quote Is Ready: ${businessTitle}`,

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
                🖨️
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Printing Quote Is Ready
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
                for your printing request.
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
                  <strong>Product:</strong>
                  ${request.productType || "Not specified"}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Quantity:</strong>
                  ${request.quantity || 1}
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

    request.customerQuoteEmailSentAt =
      new Date();

    await request.save();
  } catch (emailErr) {
    console.error(
      "Printing quote email failed:",
      emailErr
    );
  }
}

if (
  status === "In Production" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Printing Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Printing Order Is In Production: ${businessTitle}`,

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
                🖨️
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Your Printing Order Is In Production
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
                Good news — ${businessTitle} has started
                production on your printing order.
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
                  <strong>Product:</strong>
                  ${request.productType || "Not specified"}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Quantity:</strong>
                  ${request.quantity || 1}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Status:</strong>
                  In Production
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                You will receive another update when
                your order is ready for pickup,
                delivery, or shipping.
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
      "Printing In Production email failed:",
      emailErr
    );
  }
}

if (
  status === "Ready" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Printing Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Printing Order Is Ready: ${businessTitle}`,

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
                Your Printing Order Is Ready
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
                Good news — your printing order from
                ${businessTitle} is ready.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#f0fdf4;
                border:1px solid #bbf7d0;
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
                  <strong>Product:</strong>
                  ${request.productType || "Not specified"}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Quantity:</strong>
                  ${request.quantity || 1}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Fulfillment:</strong>
                  ${request.fulfillmentMethod || "Either"}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Status:</strong>
                  Ready
                </p>
              </div>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                Please coordinate pickup, delivery,
                or shipping directly with the business
                based on your selected fulfillment method.
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
      "Printing Ready email failed:",
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
      "Printing Services";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Printing Order Has Been Completed: ${businessTitle}`,

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
                Your Printing Order Has Been Completed
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
                Your printing order with
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
                  <strong>Product:</strong>
                  ${request.productType || "Not specified"}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
                  <strong>Quantity:</strong>
                  ${request.quantity || 1}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                ">
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
                final questions about your order.
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
      "Printing Completed email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Printing service request status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Printing service request status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Printing service request status.",
      });
    }
  }
);

export default router;