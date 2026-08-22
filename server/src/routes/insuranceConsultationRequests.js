import express from "express";
import mongoose from "mongoose";
import InsuranceConsultationRequest from "../models/InsuranceConsultationRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/*
  PUBLIC
  Create Insurance consultation request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
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
      !serviceType
    ) {
      return res.status(400).json({
        message:
          "Please provide all required consultation request information.",
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
    ).populate(
      "ownerId",
      "name email"
    );

    if (!listing) {
      return res.status(404).json({
        message:
          "Insurance Agent listing not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Insurance Agent listing is not currently accepting consultation requests.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const request =
      await InsuranceConsultationRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId._id,
        customerName,
        customerEmail,
        customerPhone,
        serviceType,
        preferredConsultationDate:
          preferredConsultationDate || null,
        preferredConsultationTime,
        preferredContactMethod,
        message,
      });

    return res.status(201).json({
      message:
        "Insurance consultation request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Insurance consultation request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Insurance consultation request.",
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
        await InsuranceConsultationRequest.find({
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
        "Load Insurance consultation requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Insurance consultation requests.",
      });
    }
  }
);

/*
  OWNER
  Update Insurance consultation request status
*/
router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const {
        status,
        ownerNotes = "",
        scheduledConsultationDate = null,
        scheduledConsultationTime = "",
      } = req.body || {};

      const allowedStatuses = [
        "New",
        "Contacted",
        "Consultation Scheduled",
        "Client",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Insurance consultation status.",
        });
      }

      const request =
        await InsuranceConsultationRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Insurance consultation request not found.",
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

        request.scheduledConsultationDate =
          scheduledConsultationDate
            ? new Date(scheduledConsultationDate)
            : null;

        request.scheduledConsultationTime =
          String(
            scheduledConsultationTime || ""
          ).trim();
      }

      if (status === "Client") {
        request.clientAt = now;
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
  status === "Contacted" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Insurance & Financial Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Update on Your Insurance & Financial Services Consultation: ${businessTitle}`,
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
              padding:32px 28px;
              text-align:center;
              background:linear-gradient(135deg,#1d4ed8,#3b82f6);
              color:#ffffff;
            ">
              <div style="
                font-size:38px;
                margin-bottom:10px;
              ">
                🛡️
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
              ">
                Your Consultation Request Has Been Reviewed
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
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
                Thank you for requesting an Insurance
                & Financial Services consultation through
                HubEthio.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has reviewed your request
                and has marked it as
                <strong>Contacted</strong>. The business
                may contact you using your preferred
                contact method to discuss your needs and
                next steps.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:14px;
              ">
                <div style="
                  margin-bottom:12px;
                  color:#1d4ed8;
                  font-weight:800;
                ">
                  Consultation Details
                </div>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Preferred Contact:</strong>
                  ${request.preferredContactMethod}
                </p>
              </div>

              ${
                request.ownerNotes
                  ? `
                    <div style="
                      margin:24px 0;
                      padding:18px;
                      background:#f8fafc;
                      border:1px solid #e2e8f0;
                      border-radius:14px;
                    ">
                      <strong style="
                        color:#334155;
                      ">
                        Message from the business
                      </strong>

                      <p style="
                        margin:8px 0 0;
                        font-size:14px;
                        line-height:1.7;
                        color:#475569;
                      ">
                        ${request.ownerNotes}
                      </p>
                    </div>
                  `
                  : ""
              }

              <p style="
                font-size:14px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio helps connect customers with
                independent service providers. Please
                discuss coverage, eligibility, pricing,
                products, and financial recommendations
                directly with the provider.
              </p>

              <p style="
                margin-top:26px;
                font-size:15px;
                line-height:1.7;
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
      "Insurance Contacted status email failed:",
      emailErr
    );
  }
}

if (
  status === "Consultation Scheduled" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Insurance & Financial Services";

    const formattedScheduledDate =
      request.scheduledConsultationDate
        ? new Date(
            request.scheduledConsultationDate
          ).toLocaleDateString("en-US", {
            timeZone: "UTC",
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "Date to be confirmed";

    const formattedScheduledTime = (() => {
      const time = String(
        request.scheduledConsultationTime || ""
      ).trim();

      if (!time) {
        return "Time to be confirmed";
      }

      const match =
        time.match(/^(\d{1,2}):(\d{2})$/);

      if (!match) {
        return time;
      }

      let hours = Number(match[1]);
      const minutes = match[2];

      const period =
        hours >= 12 ? "PM" : "AM";

      hours = hours % 12 || 12;

      return `${hours}:${minutes} ${period}`;
    })();

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Your Insurance & Financial Services Consultation Is Scheduled: ${businessTitle}`,

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
              background:linear-gradient(135deg,#1e3a8a,#2563eb,#60a5fa);
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                📅
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
                line-height:1.25;
              ">
                Your Consultation Is Scheduled
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                ${businessTitle}
                has confirmed your consultation.
              </p>
            </div>

            <div style="
              padding:30px 28px;
            ">
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
                Your Insurance & Financial Services
                consultation has been scheduled.
                Please review the confirmed appointment
                details below.
              </p>

              <div style="
                margin:26px 0;
                padding:22px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:16px;
                text-align:center;
              ">
                <div style="
                  margin-bottom:14px;
                  color:#1d4ed8;
                  font-size:17px;
                  font-weight:800;
                ">
                  Confirmed Consultation
                </div>

                <p style="
                  margin:8px 0;
                  font-size:17px;
                  font-weight:800;
                  color:#0f172a;
                ">
                  📅 ${formattedScheduledDate}
                </p>

                <p style="
                  margin:8px 0;
                  font-size:17px;
                  font-weight:800;
                  color:#0f172a;
                ">
                  🕒 ${formattedScheduledTime}
                </p>
              </div>

              <div style="
                margin:22px 0;
                padding:18px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:14px;
              ">
                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Business:</strong>
                  ${businessTitle}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Preferred Contact:</strong>
                  ${request.preferredContactMethod}
                </p>
              </div>

              ${
                request.ownerNotes
                  ? `
                    <div style="
                      margin:22px 0;
                      padding:18px;
                      background:#f8fafc;
                      border-left:4px solid #2563eb;
                      border-radius:10px;
                    ">
                      <strong style="
                        color:#1e40af;
                      ">
                        Message from the business
                      </strong>

                      <p style="
                        margin:8px 0 0;
                        color:#475569;
                        line-height:1.7;
                        font-size:14px;
                      ">
                        ${request.ownerNotes}
                      </p>
                    </div>
                  `
                  : ""
              }

              <div style="
                margin-top:22px;
                padding:17px;
                background:#fff7ed;
                border:1px solid #fed7aa;
                border-radius:12px;
              ">
                <strong style="
                  color:#9a3412;
                ">
                  Before your consultation
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#7c2d12;
                  line-height:1.6;
                  font-size:14px;
                ">
                  Have any questions, documents,
                  financial information, or coverage
                  details requested by the provider
                  available before your consultation.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent insurance and financial
                service providers. Products, coverage,
                pricing, eligibility, and financial
                recommendations are provided by the
                business.
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
      "Insurance Consultation Scheduled email failed:",
      emailErr
    );
  }
}

if (
  status === "Client" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Insurance & Financial Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Your Insurance & Financial Services Relationship Is Moving Forward: ${businessTitle}`,
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
              background:linear-gradient(135deg,#166534,#22c55e);
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
                line-height:1.25;
              ">
                Your Relationship Is Moving Forward
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                ${businessTitle}
                has updated your consultation status.
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
                Your Insurance & Financial Services
                consultation has been marked
                <strong>Client</strong>.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                This means the business has indicated
                that your relationship is moving forward
                beyond the initial consultation stage.
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
                  line-height:1.6;
                ">
                  <strong>Business:</strong>
                  ${businessTitle}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>
              </div>

              ${
                request.ownerNotes
                  ? `
                    <div style="
                      margin:22px 0;
                      padding:18px;
                      background:#f8fafc;
                      border-left:4px solid #22c55e;
                      border-radius:10px;
                    ">
                      <strong style="
                        color:#166534;
                      ">
                        Message from the business
                      </strong>

                      <p style="
                        margin:8px 0 0;
                        color:#475569;
                        line-height:1.7;
                        font-size:14px;
                      ">
                        ${request.ownerNotes}
                      </p>
                    </div>
                  `
                  : ""
              }

              <div style="
                margin-top:22px;
                padding:17px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:12px;
              ">
                <strong style="
                  color:#1e40af;
                ">
                  Next steps
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#1e3a8a;
                  line-height:1.6;
                  font-size:14px;
                ">
                  Please continue communicating directly
                  with the provider regarding applications,
                  documents, product details, coverage,
                  eligibility, fees, and any financial
                  planning next steps.
                </p>
              </div>

              <div style="
                margin-top:18px;
                padding:16px;
                background:#fff7ed;
                border:1px solid #fed7aa;
                border-radius:12px;
              ">
                <strong style="
                  color:#9a3412;
                ">
                  Important
                </strong>

                <p style="
                  margin:7px 0 0;
                  color:#7c2d12;
                  line-height:1.6;
                  font-size:14px;
                ">
                  HubEthio does not provide insurance,
                  investment, tax, or financial advice and
                  does not guarantee approval, coverage,
                  returns, eligibility, or product outcomes.
                  Please review all terms directly with the
                  provider before making financial decisions.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent community service providers.
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
      "Insurance Client status email failed:",
      emailErr
    );
  }
}

if (
  status === "Declined" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Insurance & Financial Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Update on Your Insurance & Financial Services Consultation: ${businessTitle}`,
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
              background:linear-gradient(135deg,#7f1d1d,#dc2626);
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                📄
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Consultation Status Update
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                ${businessTitle}
                has reviewed your request.
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
                Your Insurance & Financial Services
                consultation request has been marked
                <strong>Declined</strong>.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                This means the provider is not moving
                forward with this consultation request
                through HubEthio at this time.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#fef2f2;
                border:1px solid #fecaca;
                border-radius:14px;
              ">
                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Business:</strong>
                  ${businessTitle}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>
              </div>

              ${
                request.ownerNotes
                  ? `
                    <div style="
                      margin:22px 0;
                      padding:18px;
                      background:#f8fafc;
                      border-left:4px solid #dc2626;
                      border-radius:10px;
                    ">
                      <strong style="color:#991b1b;">
                        Message from the business
                      </strong>

                      <p style="
                        margin:8px 0 0;
                        color:#475569;
                        line-height:1.7;
                        font-size:14px;
                      ">
                        ${request.ownerNotes}
                      </p>
                    </div>
                  `
                  : ""
              }

              <div style="
                margin-top:22px;
                padding:17px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:12px;
              ">
                <strong style="color:#1e40af;">
                  You may still have other options
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#1e3a8a;
                  line-height:1.6;
                  font-size:14px;
                ">
                  You may contact another qualified
                  insurance or financial services
                  professional for an independent
                  consultation regarding your needs.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent service providers and does
                not make decisions regarding coverage,
                eligibility, financial products, or
                whether a provider accepts a customer.
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
      "Insurance Declined status email failed:",
      emailErr
    );
  }
}

if (
  status === "Closed" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Insurance & Financial Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Your Consultation Request Has Been Closed: ${businessTitle}`,
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
                #334155,
                #64748b
              );
              color:#ffffff;
            ">
              <div style="
                font-size:40px;
                margin-bottom:10px;
              ">
                ✓
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
              ">
                Consultation Request Closed
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                Your consultation request with
                ${businessTitle} has been closed.
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
                Your Insurance & Financial Services
                consultation request has now been
                marked <strong>Closed</strong>.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                No additional action is required
                through this HubEthio consultation
                request at this time.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#f8fafc;
                border:1px solid #e2e8f0;
                border-radius:14px;
              ">

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Business:</strong>
                  ${businessTitle}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Service:</strong>
                  ${request.serviceType}
                </p>

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Status:</strong>
                  Closed
                </p>
              </div>

              ${
                request.ownerNotes
                  ? `
                    <div style="
                      margin:22px 0;
                      padding:18px;
                      background:#f8fafc;
                      border-left:4px solid #64748b;
                      border-radius:10px;
                    ">
                      <strong style="
                        color:#334155;
                      ">
                        Message from the business
                      </strong>

                      <p style="
                        margin:8px 0 0;
                        color:#475569;
                        line-height:1.7;
                        font-size:14px;
                      ">
                        ${request.ownerNotes}
                      </p>
                    </div>
                  `
                  : ""
              }

              <div style="
                margin-top:22px;
                padding:17px;
                background:#eff6ff;
                border:1px solid #bfdbfe;
                border-radius:12px;
              ">
                <strong style="color:#1e40af;">
                  Need additional assistance?
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#1e3a8a;
                  line-height:1.6;
                  font-size:14px;
                ">
                  You may contact the business
                  directly or submit another
                  consultation request through
                  HubEthio if you need additional
                  assistance in the future.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent service providers and
                does not provide insurance,
                investment, financial, tax, or legal
                advice.
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
      "Insurance Closed status email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Insurance consultation status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Insurance consultation status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Insurance consultation status.",
      });
    }
  }
);

export default router;