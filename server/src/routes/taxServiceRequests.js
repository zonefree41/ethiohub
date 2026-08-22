import express from "express";
import mongoose from "mongoose";
import TaxServiceRequest from "../models/TaxServiceRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

/*
  PUBLIC
  Create Tax service request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      serviceType,
      preferredAppointmentDate = null,
      preferredAppointmentTime = "",
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
          "Please provide all required Tax service request information.",
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
          "Tax Preparer listing not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Tax Preparer listing is not currently accepting service requests.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const request =
      await TaxServiceRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId._id,
        customerName,
        customerEmail,
        customerPhone,
        serviceType,
        preferredAppointmentDate:
          preferredAppointmentDate || null,
        preferredAppointmentTime,
        preferredContactMethod,
        message,
      });

    return res.status(201).json({
      message:
        "Tax service request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Tax service request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Tax service request.",
    });
  }
});

/*
  OWNER
  Get Tax service requests for logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
        await TaxServiceRequest.find({
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
        "Load Tax service requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Tax service requests.",
      });
    }
  }
);

/*
  OWNER
  Update Tax service request status
*/
router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const {
        status,
        ownerNotes = "",
        scheduledAppointmentDate = null,
        scheduledAppointmentTime = "",
      } = req.body || {};

      const allowedStatuses = [
        "New",
        "Contacted",
        "Appointment Scheduled",
        "In Preparation",
        "Completed",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Tax service request status.",
        });
      }

      const request =
        await TaxServiceRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Tax service request not found.",
        });
      }

      request.status = status;
      request.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

      if (status === "Contacted") {
        request.contactedAt = now;
      }

      if (status === "Appointment Scheduled") {
        request.appointmentScheduledAt = now;

        request.scheduledAppointmentDate =
          scheduledAppointmentDate
            ? new Date(scheduledAppointmentDate)
            : null;

        request.scheduledAppointmentTime =
          String(
            scheduledAppointmentTime || ""
          ).trim();
      }

      if (status === "In Preparation") {
        request.preparationStartedAt = now;
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
  status === "Contacted" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Tax Preparation Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Update on Your Tax Service Request: ${businessTitle}`,
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
              background:linear-gradient(135deg,#0f766e,#14b8a6);
              color:#ffffff;
            ">
              <div style="
                font-size:38px;
                margin-bottom:10px;
              ">
                🧾
              </div>

              <h1 style="
                margin:0;
                font-size:26px;
              ">
                Your Tax Service Request Has Been Reviewed
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
                Thank you for requesting Tax Preparation
                services through HubEthio.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                ${businessTitle} has reviewed your request
                and marked it as
                <strong>Contacted</strong>. The business
                may contact you using your preferred
                contact method to discuss your tax needs
                and next steps.
              </p>

              <div style="
                margin:24px 0;
                padding:18px;
                background:#f0fdfa;
                border:1px solid #99f6e4;
                border-radius:14px;
              ">
                <div style="
                  margin-bottom:12px;
                  color:#0f766e;
                  font-weight:800;
                ">
                  Tax Service Details
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
                independent tax professionals. Please
                discuss tax advice, pricing, filing
                requirements, and document requirements
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
      "Tax Contacted status email failed:",
      emailErr
    );
  }
}

if (
  status === "Appointment Scheduled" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Tax Preparation Services";

    const formattedScheduledDate =
      request.scheduledAppointmentDate
        ? new Date(
            request.scheduledAppointmentDate
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
        request.scheduledAppointmentTime || ""
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
        `Your Tax Appointment Is Scheduled: ${businessTitle}`,

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
              background:linear-gradient(135deg,#0f766e,#14b8a6,#5eead4);
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
                Your Tax Appointment Is Scheduled
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                ${businessTitle}
                has confirmed your appointment.
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
                Your tax service appointment has been
                scheduled. Please review the confirmed
                appointment details below.
              </p>

              <div style="
                margin:26px 0;
                padding:22px;
                background:#f0fdfa;
                border:1px solid #99f6e4;
                border-radius:16px;
                text-align:center;
              ">
                <div style="
                  margin-bottom:14px;
                  color:#0f766e;
                  font-size:17px;
                  font-weight:800;
                ">
                  Confirmed Appointment
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
                      border-left:4px solid #0f766e;
                      border-radius:10px;
                    ">
                      <strong style="
                        color:#0f766e;
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
                  Before your appointment
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#7c2d12;
                  line-height:1.6;
                  font-size:14px;
                ">
                  Have any tax documents, identification,
                  income records, prior returns, and other
                  information requested by the tax
                  professional available before your
                  appointment.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent tax professionals. Tax advice,
                pricing, filing requirements, and document
                requirements are provided by the business.
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
      "Tax Appointment Scheduled email failed:",
      emailErr
    );
  }
}

if (
  status === "In Preparation" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Tax Preparation Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Your Tax Service Is Now In Preparation: ${businessTitle}`,
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
                🧾
              </div>

              <h1 style="
                margin:0;
                font-size:27px;
                line-height:1.25;
              ">
                Your Tax Service Is In Preparation
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                ${businessTitle}
                has updated your tax service request.
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
                Your tax service request has been moved to
                <strong>In Preparation</strong>.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                This means ${businessTitle} has started
                working on your requested tax service.
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
                  What happens next
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#1e3a8a;
                  line-height:1.6;
                  font-size:14px;
                ">
                  Please remain available in case the tax
                  professional needs additional documents,
                  identification, income information,
                  prior-year returns, or clarification.
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
                  HubEthio connects customers with
                  independent tax professionals. Tax
                  preparation, tax advice, filing decisions,
                  pricing, and document requirements are
                  handled directly by the provider.
                </p>
              </div>

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
      "Tax In Preparation status email failed:",
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
      "Tax Preparation Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Your Tax Service Has Been Completed: ${businessTitle}`,
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
                Your Tax Service Has Been Completed
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                ${businessTitle}
                has completed your tax service request.
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
                Your requested tax service has been marked
                <strong>Completed</strong> by
                ${businessTitle}.
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

                <p style="
                  margin:6px 0;
                  font-size:14px;
                  line-height:1.6;
                ">
                  <strong>Status:</strong>
                  Completed
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
                  Please communicate directly with the tax
                  professional regarding completed returns,
                  copies of documents, filing confirmation,
                  payment instructions, or any remaining
                  questions.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent tax professionals. HubEthio
                does not prepare or file tax returns and
                does not provide tax or legal advice.
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
      "Tax Completed status email failed:",
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
      "Tax Preparation Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Update on Your Tax Service Request: ${businessTitle}`,
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
                Tax Service Request Update
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
                Your tax service request has been marked
                <strong>Declined</strong>.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                This means the tax professional is not
                moving forward with this service request
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
                  You may contact another qualified tax
                  professional through HubEthio or directly
                  for assistance with your tax needs.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent tax professionals and does not
                decide whether a provider accepts a customer
                or service request.
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
      "Tax Declined status email failed:",
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
      "Tax Preparation Services";

    await sendEmail({
      to: request.customerEmail,
      subject:
        `Your Tax Service Request Has Been Closed: ${businessTitle}`,
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
                Tax Service Request Closed
              </h1>

              <p style="
                margin:10px 0 0;
                opacity:.95;
                line-height:1.6;
              ">
                Your tax service request with
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
                Your tax service request has now been
                marked <strong>Closed</strong>.
              </p>

              <p style="
                font-size:15px;
                line-height:1.7;
                color:#4b5563;
              ">
                No additional action is required through
                this HubEthio tax service request at this time.
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
                  You may contact the tax professional
                  directly or submit another tax service
                  request through HubEthio if you need
                  additional assistance in the future.
                </p>
              </div>

              <p style="
                margin-top:24px;
                font-size:13px;
                line-height:1.7;
                color:#6b7280;
              ">
                HubEthio connects customers with
                independent tax professionals and does not
                prepare or file tax returns or provide tax
                or legal advice.
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
      "Tax Closed status email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Tax service request status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Tax service request status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Tax service request status.",
      });
    }
  }
);

export default router;