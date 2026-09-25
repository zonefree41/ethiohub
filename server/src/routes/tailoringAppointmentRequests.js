import express from "express";
import mongoose from "mongoose";
import TailoringAppointmentRequest from "../models/TailoringAppointmentRequest.js";
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
  Create a new Tailoring appointment request
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

    const listing = await Listing.findById(listingId)
      .populate("ownerId", "email")
      .populate("categoryId", "slug");

    if (!listing) {
      return res.status(404).json({
        message: "Tailoring business not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Tailoring business is not currently available for appointment requests.",
      });
    }

    if (listing.categoryId?.slug !== "tailoring-alterations") {
      return res.status(400).json({
        message:
          "This listing is not a Tailoring & Alterations business.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const request =
      await TailoringAppointmentRequest.create({
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
        `New Tailoring appointment request: ${listing.title}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
          <h1 style="color:#7a2459;">
            New Tailoring Appointment Request
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
            Log in to your HubEthio Tailoring Workspace
            to confirm, decline, or manage this request.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a
              href="https://hubethio.com/owner/workspaces/tailoring"
              style="display:inline-block;background:#7a2459;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;"
            >
              Open Tailoring Workspace
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
      "Tailoring owner notification email failed:",
      emailErr
    );
  }
}

try {
  await sendEmail({
    to: customerEmail,
    subject: `Your Tailoring appointment request was received: ${listing.title}`,
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
    "Tailoring customer confirmation email failed:",
    emailErr
  );
}

    return res.status(201).json({
      message:
        "Tailoring appointment request submitted successfully.",
      request,
    });
  } catch (err) {
    console.error(
      "Create Tailoring appointment request error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Tailoring appointment request.",
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
  await TailoringAppointmentRequest.find({
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
        "Load Tailoring owner requests error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Tailoring appointment requests.",
      });
    }
  }
);

/*
  OWNER
  Update Tailoring appointment request status
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
            "Invalid Tailoring appointment status.",
        });
      }

      const request =
        await TailoringAppointmentRequest.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!request) {
        return res.status(404).json({
          message:
            "Tailoring appointment request not found.",
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
      "Tailoring business";

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
        `Tailoring appointment ${status}: ${businessTitle}`,

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
      "Tailoring status notification email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Tailoring appointment status updated successfully.",
        request,
      });
    } catch (err) {
      console.error(
        "Update Tailoring appointment status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Tailoring appointment status.",
      });
    }
  }
);

export default router;
