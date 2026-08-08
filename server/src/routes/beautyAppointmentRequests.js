import express from "express";
import BeautyAppointmentRequest from "../models/BeautyAppointmentRequest.js";
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
  Create a new Beauty appointment request
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      service,
      preferredDate,
      preferredTime,
      notes = "",
    } = req.body;

    if (
      !listingId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !service ||
      !preferredDate ||
      !preferredTime
    ) {
      return res.status(400).json({
        message:
          "Please provide all required appointment information.",
      });
    }

    const listing = await Listing.findById(
  listingId
).populate(
  "ownerId",
  "email"
);

    if (!listing) {
      return res.status(404).json({
        message: "Beauty business not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Beauty business is not currently available for appointment requests.",
      });
    }

    if (
      listing.categoryId?.toString() &&
      !listing.ownerId
    ) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const request =
      await BeautyAppointmentRequest.create({
        listingId: listing._id,
        ownerId: listing.ownerId._id,
        customerName,
        customerEmail,
        customerPhone,
        service,
        preferredDate,
        preferredTime,
        notes,
      });

      const ownerEmail = listing.ownerId?.email;

if (ownerEmail) {
  try {
    const formattedDate =
      new Date(preferredDate).toLocaleDateString(
        "en-US",
        {
          timeZone: "UTC",
        }
      );

    await sendEmail({
      to: ownerEmail,
      subject:
        `New Beauty appointment request: ${listing.title}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
          <h1 style="color:#7a2459;">
            New Beauty Appointment Request
          </h1>

          <p>
            You received a new appointment request for
            <strong>${escapeHtml(listing.title)}</strong>.
          </p>

          <div style="background:#fff7fb;border:1px solid #eadce5;border-radius:12px;padding:20px;margin:24px 0;">
            <p>
              <strong>Customer:</strong>
              ${escapeHtml(customerName)}
            </p>

            <p>
              <strong>Email:</strong>
              ${escapeHtml(customerEmail)}
            </p>

            <p>
              <strong>Phone:</strong>
              ${escapeHtml(customerPhone)}
            </p>

            <p>
              <strong>Service:</strong>
              ${escapeHtml(service)}
            </p>

            <p>
              <strong>Preferred Date:</strong>
              ${escapeHtml(formattedDate)}
            </p>

            <p>
              <strong>Preferred Time:</strong>
              ${escapeHtml(preferredTime)}
            </p>

            ${
              notes
                ? `
                  <p>
                    <strong>Customer Notes:</strong><br/>
                    ${escapeHtml(notes).replaceAll(
                      "\n",
                      "<br/>"
                    )}
                  </p>
                `
                : ""
            }
          </div>

          <p>
            Log in to your HubEthio Beauty Workspace
            to confirm, decline, or manage this request.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a
              href="https://hubethio.com/owner/workspaces/beauty"
              style="display:inline-block;background:#7a2459;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;"
            >
              Open Beauty Workspace
            </a>
          </div>

          <p style="color:#64748b;font-size:13px;">
            HubEthio Business Services
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Beauty owner notification email failed:",
      emailErr
    );
  }
}

try {
  await sendEmail({
    to: customerEmail,
    subject: `Your Beauty appointment request was received: ${listing.title}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
        <h1 style="color:#7a2459;">
          Appointment Request Received
        </h1>

        <p>
          Hello ${escapeHtml(customerName)},
        </p>

        <p>
          Your appointment request was successfully sent to
          <strong>${escapeHtml(listing.title)}</strong>.
        </p>

        <div style="background:#fff7fb;border:1px solid #eadce5;border-radius:12px;padding:20px;margin:24px 0;">
          <p>
            <strong>Service:</strong>
            ${escapeHtml(service)}
          </p>

          <p>
            <strong>Preferred Date:</strong>
            ${escapeHtml(
              new Date(preferredDate).toLocaleDateString(
                "en-US",
                { timeZone: "UTC" }
              )
            )}
          </p>

          <p>
            <strong>Preferred Time:</strong>
            ${escapeHtml(preferredTime)}
          </p>

          ${
            notes
              ? `
                <p>
                  <strong>Your Notes:</strong><br/>
                  ${escapeHtml(notes).replaceAll(
                    "\n",
                    "<br/>"
                  )}
                </p>
              `
              : ""
          }
        </div>

        <p>
          This is a request, not a confirmed appointment yet.
          The business will review your requested date and time.
        </p>

        <p style="color:#64748b;font-size:13px;">
          HubEthio Business Services
        </p>
      </div>
    `,
  });
} catch (emailErr) {
  console.error(
    "Beauty customer confirmation email failed:",
    emailErr
  );
}

    return res.status(201).json({
      message:
        "Beauty appointment request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Beauty appointment request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Beauty appointment request.",
    });
  }
});

/*
  OWNER
  Get appointment requests for logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const requests =
  await BeautyAppointmentRequest.find({
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
        "Load Beauty owner requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Beauty appointment requests.",
      });
    }
  }
);

/*
  OWNER
  Update Beauty appointment request status
*/
router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const { status, ownerNotes = "" } =
        req.body;

      const allowedStatuses = [
        "New",
        "Confirmed",
        "Declined",
        "Completed",
        "Cancelled",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Beauty appointment status.",
        });
      }

      const request =
        await BeautyAppointmentRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Beauty appointment request not found.",
        });
      }

      request.status = status;
      request.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

      if (status === "Confirmed") {
        request.confirmedAt = now;
      }

      if (status === "Declined") {
        request.declinedAt = now;
      }

      if (status === "Completed") {
        request.completedAt = now;
      }

      if (status === "Cancelled") {
        request.cancelledAt = now;
      }

      await request.save();

      await request.populate(
        "listingId",
        "title city state status"
      );

      if (
  request.customerEmail &&
  status !== "New"
) {
  try {
    const businessTitle =
      request.listingId?.title ||
      "Beauty business";

    const statusMessages = {
      Confirmed:
        "Your appointment request has been confirmed.",

      Declined:
        "Your appointment request was declined.",

      Completed:
        "Your appointment has been marked as completed.",

      Cancelled:
        "Your appointment has been cancelled.",
    };

    const statusMessage =
      statusMessages[status] ||
      `Your appointment status is now ${status}.`;

    const formattedDate =
      request.preferredDate
        ? new Date(
            request.preferredDate
          ).toLocaleDateString(
            "en-US",
            {
              timeZone: "UTC",
            }
          )
        : "Not provided";

    await sendEmail({
      to: request.customerEmail,

      subject:
        `Beauty appointment ${status}: ${businessTitle}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
          <h1 style="color:#7a2459;">
            Appointment ${escapeHtml(status)}
          </h1>

          <p>
            Hello ${escapeHtml(
              request.customerName
            )},
          </p>

          <p>
            ${escapeHtml(statusMessage)}
          </p>

          <p>
            Business:
            <strong>
              ${escapeHtml(businessTitle)}
            </strong>
          </p>

          <div style="background:#fff7fb;border:1px solid #eadce5;border-radius:12px;padding:20px;margin:24px 0;">
            <p>
              <strong>Service:</strong>
              ${escapeHtml(
                request.service
              )}
            </p>

            <p>
              <strong>Date:</strong>
              ${escapeHtml(
                formattedDate
              )}
            </p>

            <p>
              <strong>Time:</strong>
              ${escapeHtml(
                request.preferredTime
              )}
            </p>

            ${
              request.ownerNotes
                ? `
                  <p>
                    <strong>Business Notes:</strong><br/>
                    ${escapeHtml(
                      request.ownerNotes
                    ).replaceAll(
                      "\n",
                      "<br/>"
                    )}
                  </p>
                `
                : ""
            }
          </div>

          ${
            status === "Confirmed"
              ? `
                <p>
                  Please contact the business directly
                  if you need to make changes to your
                  appointment.
                </p>
              `
              : ""
          }

          <p style="color:#64748b;font-size:13px;">
            HubEthio Business Services
          </p>
        </div>
      `,
    });
  } catch (emailErr) {
    console.error(
      "Beauty status notification email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Beauty appointment status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Beauty appointment status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Beauty appointment status.",
      });
    }
  }
);

export default router;