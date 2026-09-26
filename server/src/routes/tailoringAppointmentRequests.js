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


function tailoringEmailLayout({
  title,
  subtitle = "",
  badge = "",
  content = "",
}) {
  return `
    <div style="margin:0;padding:0;background:#f6f3f5;font-family:Arial,sans-serif;color:#1f2937;">
      <div style="max-width:640px;margin:0 auto;padding:32px 16px;">
        <div style="background:#7a2459;border-radius:18px 18px 0 0;padding:28px 24px;text-align:center;">
          <div style="font-size:14px;font-weight:700;letter-spacing:1.5px;color:#fce7f3;text-transform:uppercase;">
            HubEthio
          </div>

          <h1 style="margin:10px 0 6px;font-size:27px;line-height:1.25;color:#ffffff;">
            ${title}
          </h1>

          ${
            subtitle
              ? `
                <p style="margin:0;color:#fce7f3;font-size:15px;line-height:1.5;">
                  ${subtitle}
                </p>
              `
              : ""
          }
        </div>

        <div style="background:#ffffff;border:1px solid #eadce5;border-top:0;border-radius:0 0 18px 18px;padding:28px 24px;">
          ${
            badge
              ? `
                <div style="display:inline-block;background:#fff1f7;color:#7a2459;border:1px solid #f3d3e3;border-radius:999px;padding:7px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;margin-bottom:20px;">
                  ${badge}
                </div>
              `
              : ""
          }

          ${content}

          <div style="border-top:1px solid #e5e7eb;margin-top:28px;padding-top:18px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
              HubEthio &bull; Ethiopian Community Services
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
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

      html: tailoringEmailLayout({
        title: "New Tailoring Appointment Request",
        subtitle: "A customer is waiting for your response.",
        badge: "New Request",
        content: `
          <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">
            You received a new appointment request for
            <strong>${escapeHtml(listing.title)}</strong>.
          </p>

          <p style="margin:0 0 22px;color:#64748b;font-size:14px;line-height:1.6;">
            Review the customer details below, then open your Tailoring Workspace to confirm or decline the request.
          </p>

          <div style="background:#fff8fb;border:1px solid #eadce5;border-radius:14px;padding:20px;">
            <div style="font-size:13px;font-weight:700;color:#7a2459;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px;">
              Appointment Details
            </div>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Customer:</strong><br/>
              ${escapeHtml(customerName)}
            </p>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Email:</strong><br/>
              ${escapeHtml(customerEmail)}
            </p>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Phone:</strong><br/>
              ${escapeHtml(customerPhone)}
            </p>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Service:</strong><br/>
              ${escapeHtml(service)}
            </p>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Preferred Date:</strong><br/>
              ${escapeHtml(formattedDate)}
            </p>

            <p style="margin:0;line-height:1.5;">
              <strong>Preferred Time:</strong><br/>
              ${escapeHtml(preferredTime)}
            </p>

            ${
              notes
                ? `
                  <div style="border-top:1px solid #eadce5;margin-top:18px;padding-top:18px;">
                    <p style="margin:0;line-height:1.6;">
                      <strong>Customer Notes:</strong><br/>
                      ${escapeHtml(notes).replaceAll(
                        "\n",
                        "<br/>"
                      )}
                    </p>
                  </div>
                `
                : ""
            }
          </div>

          <div style="text-align:center;margin:28px 0 18px;">
            <a
              href="${"https:" + "//" + "hubethio.com" + "/owner/workspaces/tailoring"}"
              style="display:inline-block;background:#7a2459;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-size:15px;font-weight:700;"
            >
              Open Tailoring Workspace
            </a>
          </div>

          <p style="margin:0;text-align:center;color:#64748b;font-size:13px;line-height:1.6;">
            Sign in to HubEthio to confirm, decline, or manage this appointment request.
          </p>
        `,
      }),
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
    html: tailoringEmailLayout({
      title: "Appointment Request Received",
      subtitle: "Your request has been sent to the business.",
      badge: "Request Received",
      content: `
        <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
          Hello ${escapeHtml(customerName)},
        </p>

        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;">
          Your appointment request was successfully sent to
          <strong>${escapeHtml(listing.title)}</strong>.
        </p>

        <div style="background:#fff8fb;border:1px solid #eadce5;border-radius:14px;padding:20px;">
          <div style="font-size:13px;font-weight:700;color:#7a2459;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px;">
            Your Request
          </div>

          <p style="margin:0 0 12px;line-height:1.5;">
            <strong>Service:</strong><br/>
            ${escapeHtml(service)}
          </p>

          <p style="margin:0 0 12px;line-height:1.5;">
            <strong>Preferred Date:</strong><br/>
            ${escapeHtml(
              new Date(preferredDate).toLocaleDateString(
                "en-US",
                {
                  timeZone: "UTC",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                }
              )
            )}
          </p>

          <p style="margin:0;line-height:1.5;">
            <strong>Preferred Time:</strong><br/>
            ${escapeHtml(preferredTime)}
          </p>

          ${
            notes
              ? `
                <div style="border-top:1px solid #eadce5;margin-top:18px;padding-top:18px;">
                  <p style="margin:0;line-height:1.6;">
                    <strong>Your Notes:</strong><br/>
                    ${escapeHtml(notes).replaceAll(
                      "\n",
                      "<br/>"
                    )}
                  </p>
                </div>
              `
              : ""
          }
        </div>

        <div style="background:#f8fafc;border-left:4px solid #7a2459;border-radius:8px;padding:16px 18px;margin-top:22px;">
          <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
            <strong style="color:#1f2937;">What happens next?</strong><br/>
            This is an appointment request, not a confirmed appointment yet.
            The business will review your requested date and time and notify you when the status changes.
          </p>
        </div>

        <p style="margin:22px 0 0;text-align:center;color:#64748b;font-size:13px;line-height:1.6;">
          Thank you for using HubEthio to connect with local community businesses.
        </p>
      `,
    }),
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

      html: tailoringEmailLayout({
        title: `Appointment ${escapeHtml(status)}`,
        subtitle: escapeHtml(statusMessage),
        badge: escapeHtml(status),
        content: `
          <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
            Hello ${escapeHtml(request.customerName)},
          </p>

          <p style="margin:0 0 22px;font-size:15px;line-height:1.7;">
            ${escapeHtml(statusMessage)}
          </p>

          <div style="background:#fff8fb;border:1px solid #eadce5;border-radius:14px;padding:20px;">
            <div style="font-size:13px;font-weight:700;color:#7a2459;text-transform:uppercase;letter-spacing:.6px;margin-bottom:16px;">
              Appointment Details
            </div>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Business:</strong><br/>
              ${escapeHtml(businessTitle)}
            </p>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Service:</strong><br/>
              ${escapeHtml(request.service)}
            </p>

            <p style="margin:0 0 12px;line-height:1.5;">
              <strong>Date:</strong><br/>
              ${escapeHtml(formattedDate)}
            </p>

            <p style="margin:0;line-height:1.5;">
              <strong>Time:</strong><br/>
              ${escapeHtml(request.preferredTime)}
            </p>

            ${
              request.ownerNotes
                ? `
                  <div style="border-top:1px solid #eadce5;margin-top:18px;padding-top:18px;">
                    <p style="margin:0;line-height:1.6;">
                      <strong>Business Notes:</strong><br/>
                      ${escapeHtml(
                        request.ownerNotes
                      ).replaceAll(
                        "\n",
                        "<br/>"
                      )}
                    </p>
                  </div>
                `
                : ""
            }
          </div>

          ${
            status === "Confirmed"
              ? `
                <div style="background:#f8fafc;border-left:4px solid #7a2459;border-radius:8px;padding:16px 18px;margin-top:22px;">
                  <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
                    <strong style="color:#1f2937;">Appointment confirmed</strong><br/>
                    Please contact the business directly if you need to make changes to your appointment.
                  </p>
                </div>
              `
              : ""
          }

          ${
            status === "Completed"
              ? `
                <div style="background:#f8fafc;border-left:4px solid #7a2459;border-radius:8px;padding:16px 18px;margin-top:22px;">
                  <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
                    Thank you for using HubEthio to connect with local community businesses.
                  </p>
                </div>
              `
              : ""
          }
        `,
      }),
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
