import express from "express";
import mongoose from "mongoose";
import ImmigrationConsultationRequest from "../models/ImmigrationConsultationRequest.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

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

      const ownerEmail = listing.ownerId?.email;

if (ownerEmail) {
  try {
    const businessTitle =
      listing.title || "Immigration Lawyer";

    await sendEmail({
      to: ownerEmail,
      subject: `New Immigration Consultation Request: ${businessTitle}`,
      html: `
        <div style="
          max-width:640px;
          margin:0 auto;
          font-family:Arial,Helvetica,sans-serif;
          background:#f8fafc;
          padding:24px;
          color:#0f172a;
        ">
          <div style="
            background:linear-gradient(135deg,#4c1d95,#7c3aed);
            color:#ffffff;
            padding:24px;
            border-radius:18px 18px 0 0;
          ">
            <h1 style="
              margin:0;
              font-size:24px;
            ">
              ⚖️ New Consultation Request
            </h1>

            <p style="
              margin:8px 0 0;
              opacity:.92;
            ">
              A new potential client contacted you through HubEthio.
            </p>
          </div>

          <div style="
            background:#ffffff;
            padding:24px;
            border:1px solid #e2e8f0;
            border-top:0;
            border-radius:0 0 18px 18px;
          ">
            <h2 style="
              margin-top:0;
              color:#4c1d95;
            ">
              ${escapeHtml(businessTitle)}
            </h2>

            <div style="
              background:#faf5ff;
              border:1px solid #ddd6fe;
              border-radius:14px;
              padding:18px;
              margin:18px 0;
            ">
              <p><strong>Client:</strong> ${escapeHtml(customerName)}</p>
              <p><strong>Case Type:</strong> ${escapeHtml(caseType)}</p>
              <p><strong>Email:</strong> ${escapeHtml(customerEmail)}</p>
              <p><strong>Phone:</strong> ${escapeHtml(customerPhone)}</p>
              <p><strong>Preferred Contact:</strong> ${escapeHtml(preferredContactMethod)}</p>
              <p><strong>Preferred Date:</strong> ${
                preferredConsultationDate
                  ? escapeHtml(preferredConsultationDate)
                  : "Not provided"
              }</p>
              <p><strong>Preferred Time:</strong> ${
                preferredConsultationTime
                  ? escapeHtml(preferredConsultationTime)
                  : "Not provided"
              }</p>
            </div>

            ${
              message
                ? `
                  <div style="
                    background:#f8fafc;
                    border-left:4px solid #7c3aed;
                    padding:14px 16px;
                    margin:18px 0;
                  ">
                    <strong>Client Message</strong>
                    <p style="
                      margin:8px 0 0;
                      line-height:1.6;
                    ">
                      ${escapeHtml(message)}
                    </p>
                  </div>
                `
                : ""
            }

            <div style="text-align:center;margin-top:24px;">
              <a
                href="https://hubethio.com/owner/workspaces/immigration"
                style="
                  display:inline-block;
                  background:#7c3aed;
                  color:#ffffff;
                  text-decoration:none;
                  padding:13px 20px;
                  border-radius:10px;
                  font-weight:700;
                "
              >
                Open Immigration Workspace
              </a>
            </div>

            <p style="
              margin-top:24px;
              color:#64748b;
              font-size:13px;
              line-height:1.5;
            ">
              This message was sent because a customer submitted an
              Immigration consultation request through your HubEthio listing.
            </p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error(
      "Immigration owner notification email failed:",
      emailError
    );
  }
}

try {
  const businessTitle =
    listing.title || "Immigration Lawyer";

  await sendEmail({
    to: customerEmail,
    subject: `Your Immigration Consultation Request Was Received: ${businessTitle}`,
    html: `
      <div style="
        max-width:640px;
        margin:0 auto;
        font-family:Arial,Helvetica,sans-serif;
        background:#f8fafc;
        padding:24px;
        color:#0f172a;
      ">
        <div style="
          background:linear-gradient(135deg,#312e81,#7c3aed);
          color:#ffffff;
          padding:24px;
          border-radius:18px 18px 0 0;
        ">
          <h1 style="
            margin:0;
            font-size:24px;
          ">
            ⚖️ Consultation Request Received
          </h1>

          <p style="
            margin:8px 0 0;
            opacity:.92;
          ">
            Thank you for contacting an Immigration Lawyer through HubEthio.
          </p>
        </div>

        <div style="
          background:#ffffff;
          padding:24px;
          border:1px solid #e2e8f0;
          border-top:0;
          border-radius:0 0 18px 18px;
        ">
          <p style="font-size:16px;">
            Hello ${escapeHtml(customerName)},
          </p>

          <p style="
            line-height:1.7;
            color:#475569;
          ">
            Your consultation request has been successfully
            sent to <strong>${escapeHtml(businessTitle)}</strong>.
            The law office can now review your request and
            contact you regarding next steps.
          </p>

          <div style="
            background:#faf5ff;
            border:1px solid #ddd6fe;
            border-radius:14px;
            padding:18px;
            margin:20px 0;
          ">
            <p><strong>Case Type:</strong> ${escapeHtml(caseType)}</p>

            <p>
              <strong>Preferred Contact:</strong>
              ${escapeHtml(preferredContactMethod)}
            </p>

            <p>
              <strong>Preferred Date:</strong>
              ${
                preferredConsultationDate
                  ? escapeHtml(preferredConsultationDate)
                  : "Not provided"
              }
            </p>

            <p>
              <strong>Preferred Time:</strong>
              ${
                preferredConsultationTime
                  ? escapeHtml(preferredConsultationTime)
                  : "Not provided"
              }
            </p>
          </div>

          ${
            message
              ? `
                <div style="
                  background:#f8fafc;
                  border-left:4px solid #7c3aed;
                  padding:14px 16px;
                  margin:18px 0;
                ">
                  <strong>Your Message</strong>

                  <p style="
                    margin:8px 0 0;
                    line-height:1.6;
                    color:#475569;
                  ">
                    ${escapeHtml(message)}
                  </p>
                </div>
              `
              : ""
          }

          <div style="
            margin-top:22px;
            padding:16px;
            border-radius:12px;
            background:#fff7ed;
            border:1px solid #fed7aa;
          ">
            <strong style="color:#9a3412;">
              Important
            </strong>

            <p style="
              margin:7px 0 0;
              color:#7c2d12;
              line-height:1.5;
              font-size:14px;
            ">
              Submitting this request does not create an
              attorney-client relationship and does not
              guarantee legal representation. The lawyer
              must review and accept your matter separately.
            </p>
          </div>

          <p style="
            margin-top:24px;
            color:#64748b;
            font-size:13px;
            line-height:1.5;
          ">
            HubEthio helps connect customers with listed
            community service providers. Legal advice and
            representation are provided only by the law office.
          </p>
        </div>
      </div>
    `,
  });
} catch (emailError) {
  console.error(
    "Immigration customer confirmation email failed:",
    emailError
  );
}

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
      const {
  status,
  ownerNotes = "",
  scheduledConsultationDate = null,
  scheduledConsultationTime = "",
} = req.body;

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

  request.scheduledConsultationDate =
    scheduledConsultationDate
      ? new Date(scheduledConsultationDate)
      : null;

  request.scheduledConsultationTime =
    String(
      scheduledConsultationTime || ""
    ).trim();
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

      if (
  status === "Contacted" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Immigration Lawyer";

    await sendEmail({
      to: request.customerEmail,
      subject: `Update on Your Immigration Consultation: ${businessTitle}`,
      html: `
        <div style="
          max-width:640px;
          margin:0 auto;
          font-family:Arial,Helvetica,sans-serif;
          background:#f8fafc;
          padding:24px;
          color:#0f172a;
        ">
          <div style="
            background:linear-gradient(135deg,#312e81,#7c3aed);
            color:#ffffff;
            padding:24px;
            border-radius:18px 18px 0 0;
          ">
            <h1 style="
              margin:0;
              font-size:24px;
            ">
              📞 Your Consultation Request Was Reviewed
            </h1>

            <p style="
              margin:8px 0 0;
              opacity:.92;
            ">
              ${escapeHtml(businessTitle)} has updated your consultation request.
            </p>
          </div>

          <div style="
            background:#ffffff;
            padding:24px;
            border:1px solid #e2e8f0;
            border-top:0;
            border-radius:0 0 18px 18px;
          ">
            <p style="font-size:16px;">
              Hello ${escapeHtml(request.customerName)},
            </p>

            <p style="
              color:#475569;
              line-height:1.7;
            ">
              Your Immigration consultation request has been marked
              <strong>Contacted</strong>.
            </p>

            <div style="
              margin:20px 0;
              padding:18px;
              border-radius:14px;
              background:#faf5ff;
              border:1px solid #ddd6fe;
            ">
              <p>
                <strong>Case Type:</strong>
                ${escapeHtml(request.caseType)}
              </p>

              <p>
                <strong>Preferred Contact:</strong>
                ${escapeHtml(
                  request.preferredContactMethod ||
                    "Either"
                )}
              </p>
            </div>

            ${
              request.ownerNotes
                ? `
                  <div style="
                    margin:18px 0;
                    padding:14px 16px;
                    background:#f8fafc;
                    border-left:4px solid #7c3aed;
                  ">
                    <strong>Update from the law office</strong>
                    <p style="
                      margin:8px 0 0;
                      line-height:1.6;
                      color:#475569;
                    ">
                      ${escapeHtml(request.ownerNotes)}
                    </p>
                  </div>
                `
                : ""
            }

            <p style="
              margin-top:22px;
              color:#64748b;
              font-size:14px;
              line-height:1.6;
            ">
              Please keep an eye on your phone, email, or WhatsApp
              based on the contact method you selected.
            </p>

            <div style="
              margin-top:22px;
              padding:16px;
              border-radius:12px;
              background:#fff7ed;
              border:1px solid #fed7aa;
            ">
              <strong style="color:#9a3412;">
                Important
              </strong>

              <p style="
                margin:7px 0 0;
                color:#7c2d12;
                line-height:1.5;
                font-size:14px;
              ">
                This status update does not create an attorney-client
                relationship or guarantee legal representation.
              </p>
            </div>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error(
      "Immigration Contacted status email failed:",
      emailError
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
      "Immigration Lawyer";

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

  const match = time.match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return time;
  }

  let hours = Number(match[1]);
  const minutes = match[2];

  const period = hours >= 12 ? "PM" : "AM";

  hours = hours % 12 || 12;

  return `${hours}:${minutes} ${period}`;
})();

await sendEmail({
  to: request.customerEmail,
  subject: `Your Immigration Consultation Is Scheduled: ${businessTitle}`,
  html: `
    <div style="
      max-width:640px;
      margin:0 auto;
      font-family:Arial,Helvetica,sans-serif;
      background:#f8fafc;
      padding:24px;
      color:#0f172a;
    ">
      <div style="
        background:linear-gradient(135deg,#312e81,#7c3aed);
        color:#ffffff;
        padding:28px 24px;
        border-radius:18px 18px 0 0;
        text-align:center;
      ">
        <div style="
          font-size:38px;
          margin-bottom:10px;
        ">
          📅
        </div>

        <h1 style="
          margin:0;
          font-size:25px;
          line-height:1.3;
        ">
          Your Consultation Is Scheduled
        </h1>

        <p style="
          margin:10px 0 0;
          opacity:.92;
          line-height:1.5;
        ">
          ${escapeHtml(businessTitle)}
          has confirmed your consultation.
        </p>
      </div>

      <div style="
        background:#ffffff;
        padding:26px 24px;
        border:1px solid #e2e8f0;
        border-top:0;
        border-radius:0 0 18px 18px;
      ">
        <p style="
          margin-top:0;
          font-size:16px;
        ">
          Hello ${escapeHtml(request.customerName)},
        </p>

        <p style="
          color:#475569;
          line-height:1.7;
        ">
          Good news — your Immigration consultation
          has been scheduled. Please review the
          confirmed appointment information below.
        </p>

        <div style="
          margin:22px 0;
          padding:22px;
          border-radius:16px;
          background:#faf5ff;
          border:1px solid #ddd6fe;
          text-align:center;
        ">
          <div style="
            color:#6d28d9;
            font-size:13px;
            font-weight:700;
            text-transform:uppercase;
            letter-spacing:.5px;
          ">
            Confirmed Consultation
          </div>

          <div style="
            margin-top:14px;
            font-size:21px;
            font-weight:800;
            color:#2e1065;
          ">
            📅 ${escapeHtml(formattedScheduledDate)}
          </div>

          <div style="
            margin-top:9px;
            font-size:19px;
            font-weight:700;
            color:#4c1d95;
          ">
            🕒 ${escapeHtml(formattedScheduledTime)}
          </div>
        </div>

        <div style="
          margin:20px 0;
          padding:18px;
          background:#f8fafc;
          border-radius:14px;
        ">
          <p style="margin:0 0 10px;">
            <strong>Law Office:</strong>
            ${escapeHtml(businessTitle)}
          </p>

          <p style="margin:0 0 10px;">
            <strong>Case Type:</strong>
            ${escapeHtml(request.caseType)}
          </p>

          <p style="margin:0;">
            <strong>Preferred Contact Method:</strong>
            ${escapeHtml(
              request.preferredContactMethod ||
                "Either"
            )}
          </p>
        </div>

        ${
          request.ownerNotes
            ? `
              <div style="
                margin:20px 0;
                padding:16px;
                border-left:4px solid #7c3aed;
                background:#fafafa;
              ">
                <strong style="color:#4c1d95;">
                  Message from the law office
                </strong>

                <p style="
                  margin:8px 0 0;
                  color:#475569;
                  line-height:1.6;
                ">
                  ${escapeHtml(request.ownerNotes)}
                </p>
              </div>
            `
            : ""
        }

        <div style="
          margin-top:22px;
          padding:17px;
          border-radius:12px;
          background:#eff6ff;
          border:1px solid #bfdbfe;
        ">
          <strong style="color:#1e40af;">
            Before your consultation
          </strong>

          <p style="
            margin:8px 0 0;
            color:#1e3a8a;
            line-height:1.6;
            font-size:14px;
          ">
            Please be available at the confirmed
            date and time. The law office may
            contact you by phone, email, WhatsApp,
            or another method arranged directly
            with you.
          </p>
        </div>

        <div style="
          margin-top:18px;
          padding:16px;
          border-radius:12px;
          background:#fff7ed;
          border:1px solid #fed7aa;
        ">
          <strong style="color:#9a3412;">
            Important
          </strong>

          <p style="
            margin:7px 0 0;
            color:#7c2d12;
            line-height:1.5;
            font-size:14px;
          ">
            Scheduling a consultation does not
            automatically create an attorney-client
            relationship or guarantee legal
            representation.
          </p>
        </div>

        <p style="
          margin-top:24px;
          color:#64748b;
          font-size:13px;
          line-height:1.6;
        ">
          HubEthio helps connect customers with
          community service providers. Legal advice
          and representation are provided only by
          the law office.
        </p>
            </div>
    </div>
  `,
    });
  } catch (emailError) {
    console.error(
      "Immigration Consultation Scheduled email failed:",
      emailError
    );
  }
}

if (
  status === "Retained" &&
  request.customerEmail
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Immigration Lawyer";

    await sendEmail({
      to: request.customerEmail,
      subject: `Your Immigration Matter Is Moving Forward: ${businessTitle}`,
      html: `
        <div style="
          max-width:640px;
          margin:0 auto;
          font-family:Arial,Helvetica,sans-serif;
          background:#f8fafc;
          padding:24px;
          color:#0f172a;
        ">
          <div style="
            background:linear-gradient(135deg,#14532d,#16a34a);
            color:#ffffff;
            padding:28px 24px;
            border-radius:18px 18px 0 0;
            text-align:center;
          ">
            <div style="
              font-size:38px;
              margin-bottom:10px;
            ">
              ✅
            </div>

            <h1 style="
              margin:0;
              font-size:25px;
              line-height:1.3;
            ">
              Your Matter Is Moving Forward
            </h1>

            <p style="
              margin:10px 0 0;
              opacity:.92;
              line-height:1.5;
            ">
              ${escapeHtml(businessTitle)}
              has updated your consultation status.
            </p>
          </div>

          <div style="
            background:#ffffff;
            padding:26px 24px;
            border:1px solid #e2e8f0;
            border-top:0;
            border-radius:0 0 18px 18px;
          ">
            <p style="
              margin-top:0;
              font-size:16px;
            ">
              Hello ${escapeHtml(request.customerName)},
            </p>

            <p style="
              color:#475569;
              line-height:1.7;
            ">
              Your immigration consultation request
              has been marked <strong>Retained</strong>.
              This means the law office has indicated
              that your matter is moving forward with
              them.
            </p>

            <div style="
              margin:22px 0;
              padding:18px;
              border-radius:14px;
              background:#f0fdf4;
              border:1px solid #bbf7d0;
            ">
              <p style="margin:0 0 10px;">
                <strong>Law Office:</strong>
                ${escapeHtml(businessTitle)}
              </p>

              <p style="margin:0;">
                <strong>Case Type:</strong>
                ${escapeHtml(request.caseType)}
              </p>
            </div>

            ${
              request.ownerNotes
                ? `
                  <div style="
                    margin:20px 0;
                    padding:16px;
                    border-left:4px solid #16a34a;
                    background:#f8fafc;
                  ">
                    <strong style="color:#166534;">
                      Message from the law office
                    </strong>

                    <p style="
                      margin:8px 0 0;
                      color:#475569;
                      line-height:1.6;
                    ">
                      ${escapeHtml(request.ownerNotes)}
                    </p>
                  </div>
                `
                : ""
            }

            <div style="
              margin-top:22px;
              padding:17px;
              border-radius:12px;
              background:#eff6ff;
              border:1px solid #bfdbfe;
            ">
              <strong style="color:#1e40af;">
                Next steps
              </strong>

              <p style="
                margin:8px 0 0;
                color:#1e3a8a;
                line-height:1.6;
                font-size:14px;
              ">
                Please continue communicating directly
                with the law office regarding documents,
                fees, representation agreements, and
                next steps for your matter.
              </p>
            </div>

            <div style="
              margin-top:18px;
              padding:16px;
              border-radius:12px;
              background:#fff7ed;
              border:1px solid #fed7aa;
            ">
              <strong style="color:#9a3412;">
                Important
              </strong>

              <p style="
                margin:7px 0 0;
                color:#7c2d12;
                line-height:1.5;
                font-size:14px;
              ">
                HubEthio does not provide legal advice
                and does not determine whether an
                attorney-client relationship has been
                formally established. Any representation
                agreement is between you and the law
                office.
              </p>
            </div>

            <p style="
              margin-top:24px;
              color:#64748b;
              font-size:13px;
              line-height:1.6;
            ">
              HubEthio helps connect customers with
              community service providers. Legal advice
              and representation are provided only by
              the law office.
            </p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error(
      "Immigration Retained status email failed:",
      emailError
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
      "Immigration Lawyer";

    await sendEmail({
      to: request.customerEmail,
      subject: `Update on Your Immigration Consultation: ${businessTitle}`,
      html: `
        <div style="
          max-width:640px;
          margin:0 auto;
          font-family:Arial,Helvetica,sans-serif;
          background:#f8fafc;
          padding:24px;
          color:#0f172a;
        ">
          <div style="
            background:linear-gradient(135deg,#7f1d1d,#dc2626);
            color:#ffffff;
            padding:28px 24px;
            border-radius:18px 18px 0 0;
            text-align:center;
          ">
            <div style="
              font-size:38px;
              margin-bottom:10px;
            ">
              📄
            </div>

            <h1 style="
              margin:0;
              font-size:25px;
              line-height:1.3;
            ">
              Consultation Status Update
            </h1>

            <p style="
              margin:10px 0 0;
              opacity:.92;
              line-height:1.5;
            ">
              ${escapeHtml(businessTitle)}
              has reviewed your consultation request.
            </p>
          </div>

          <div style="
            background:#ffffff;
            padding:26px 24px;
            border:1px solid #e2e8f0;
            border-top:0;
            border-radius:0 0 18px 18px;
          ">
            <p style="
              margin-top:0;
              font-size:16px;
            ">
              Hello ${escapeHtml(request.customerName)},
            </p>

            <p style="
              color:#475569;
              line-height:1.7;
            ">
              The law office has updated your
              immigration consultation request to
              <strong>Declined</strong>.
            </p>

            <p style="
              color:#475569;
              line-height:1.7;
            ">
              This means the office is not moving
              forward with this consultation request
              through HubEthio at this time.
            </p>

            <div style="
              margin:22px 0;
              padding:18px;
              border-radius:14px;
              background:#fef2f2;
              border:1px solid #fecaca;
            ">
              <p style="margin:0 0 10px;">
                <strong>Law Office:</strong>
                ${escapeHtml(businessTitle)}
              </p>

              <p style="margin:0;">
                <strong>Case Type:</strong>
                ${escapeHtml(request.caseType)}
              </p>
            </div>

            ${
              request.ownerNotes
                ? `
                  <div style="
                    margin:20px 0;
                    padding:16px;
                    border-left:4px solid #dc2626;
                    background:#f8fafc;
                  ">
                    <strong style="color:#991b1b;">
                      Message from the law office
                    </strong>

                    <p style="
                      margin:8px 0 0;
                      color:#475569;
                      line-height:1.6;
                    ">
                      ${escapeHtml(request.ownerNotes)}
                    </p>
                  </div>
                `
                : ""
            }

            <div style="
              margin-top:22px;
              padding:17px;
              border-radius:12px;
              background:#eff6ff;
              border:1px solid #bfdbfe;
            ">
              <strong style="color:#1e40af;">
                You may still have options
              </strong>

              <p style="
                margin:8px 0 0;
                color:#1e3a8a;
                line-height:1.6;
                font-size:14px;
              ">
                A declined consultation request from
                one law office does not prevent you
                from contacting another qualified
                immigration attorney for an
                independent evaluation.
              </p>
            </div>

            <div style="
              margin-top:18px;
              padding:16px;
              border-radius:12px;
              background:#fff7ed;
              border:1px solid #fed7aa;
            ">
              <strong style="color:#9a3412;">
                Important
              </strong>

              <p style="
                margin:7px 0 0;
                color:#7c2d12;
                line-height:1.5;
                font-size:14px;
              ">
                HubEthio does not make decisions about
                legal representation and does not
                provide legal advice. The decision to
                accept or decline a matter belongs to
                the individual law office.
              </p>
            </div>

            <p style="
              margin-top:24px;
              color:#64748b;
              font-size:13px;
              line-height:1.6;
            ">
              HubEthio helps connect customers with
              community service providers. Legal
              services are provided only by the
              individual law office.
            </p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error(
      "Immigration Declined status email failed:",
      emailError
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
      "Immigration Lawyer";

    await sendEmail({
      to: request.customerEmail,
      subject: `Your Immigration Consultation Has Been Closed: ${businessTitle}`,
      html: `
        <div style="
          max-width:640px;
          margin:0 auto;
          font-family:Arial,Helvetica,sans-serif;
          background:#f8fafc;
          padding:24px;
          color:#0f172a;
        ">
          <div style="
            background:linear-gradient(135deg,#334155,#64748b);
            color:#ffffff;
            padding:28px 24px;
            border-radius:18px 18px 0 0;
            text-align:center;
          ">
            <div style="
              font-size:38px;
              margin-bottom:10px;
            ">
              📁
            </div>

            <h1 style="
              margin:0;
              font-size:25px;
              line-height:1.3;
            ">
              Consultation Request Closed
            </h1>

            <p style="
              margin:10px 0 0;
              opacity:.92;
              line-height:1.5;
            ">
              ${escapeHtml(businessTitle)}
              has closed this consultation request.
            </p>
          </div>

          <div style="
            background:#ffffff;
            padding:26px 24px;
            border:1px solid #e2e8f0;
            border-top:0;
            border-radius:0 0 18px 18px;
          ">
            <p style="
              margin-top:0;
              font-size:16px;
            ">
              Hello ${escapeHtml(request.customerName)},
            </p>

            <p style="
              color:#475569;
              line-height:1.7;
            ">
              Your immigration consultation request
              has been marked <strong>Closed</strong>
              by the law office.
            </p>

            <div style="
              margin:22px 0;
              padding:18px;
              border-radius:14px;
              background:#f8fafc;
              border:1px solid #cbd5e1;
            ">
              <p style="margin:0 0 10px;">
                <strong>Law Office:</strong>
                ${escapeHtml(businessTitle)}
              </p>

              <p style="margin:0;">
                <strong>Case Type:</strong>
                ${escapeHtml(request.caseType)}
              </p>
            </div>

            ${
              request.ownerNotes
                ? `
                  <div style="
                    margin:20px 0;
                    padding:16px;
                    border-left:4px solid #64748b;
                    background:#f8fafc;
                  ">
                    <strong style="color:#334155;">
                      Message from the law office
                    </strong>

                    <p style="
                      margin:8px 0 0;
                      color:#475569;
                      line-height:1.6;
                    ">
                      ${escapeHtml(request.ownerNotes)}
                    </p>
                  </div>
                `
                : ""
            }

            <div style="
              margin-top:22px;
              padding:17px;
              border-radius:12px;
              background:#eff6ff;
              border:1px solid #bfdbfe;
            ">
              <strong style="color:#1e40af;">
                Need additional help?
              </strong>

              <p style="
                margin:8px 0 0;
                color:#1e3a8a;
                line-height:1.6;
                font-size:14px;
              ">
                If you still need assistance, you may
                contact the law office directly or
                submit a new consultation request to
                another qualified immigration attorney
                listed on HubEthio.
              </p>
            </div>

            <div style="
              margin-top:18px;
              padding:16px;
              border-radius:12px;
              background:#fff7ed;
              border:1px solid #fed7aa;
            ">
              <strong style="color:#9a3412;">
                Important
              </strong>

              <p style="
                margin:7px 0 0;
                color:#7c2d12;
                line-height:1.5;
                font-size:14px;
              ">
                Closing this HubEthio consultation
                request does not itself determine the
                status of any attorney-client
                relationship or legal matter. Please
                contact the law office directly if you
                have questions about your case.
              </p>
            </div>

            <p style="
              margin-top:24px;
              color:#64748b;
              font-size:13px;
              line-height:1.6;
            ">
              HubEthio helps connect customers with
              community service providers. Legal advice
              and representation are provided only by
              the individual law office.
            </p>
          </div>
        </div>
      `,
    });
  } catch (emailError) {
    console.error(
      "Immigration Closed status email failed:",
      emailError
    );
  }
}

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