import express from "express";
import HousingInquiry from "../models/HousingInquiry.js";
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
  Create a Housing inquiry for a specific listing
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      desiredMoveInDate,
      occupants = 1,
      message = "",
    } = req.body;

    if (
      !listingId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !desiredMoveInDate
    ) {
      return res.status(400).json({
        message:
          "Please provide all required housing inquiry information.",
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
        message: "Housing listing not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This housing listing is not currently available for inquiries.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This housing listing does not have an assigned owner.",
      });
    }

    const inquiry = await HousingInquiry.create({
      listingId: listing._id,
      ownerId: listing.ownerId._id,
      customerName,
      customerEmail,
      customerPhone,
      desiredMoveInDate,
      occupants: Number(occupants) || 1,
      message,
    });

    const ownerEmail = listing.ownerId?.email;

if (ownerEmail) {
  try {
    const formattedMoveInDate =
      new Date(
        desiredMoveInDate
      ).toLocaleDateString(
        "en-US",
        {
          timeZone: "UTC",
        }
      );

    await sendEmail({
      to: ownerEmail,
      subject:
        `New Housing inquiry: ${listing.title}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
          <h1 style="color:#1d4ed8;">
            New Housing Inquiry
          </h1>

          <p>
            You received a new rental inquiry for
            <strong>${escapeHtml(
              listing.title
            )}</strong>.
          </p>

          <div style="background:#f8fafc;border:1px solid #dbe4ef;border-radius:12px;padding:20px;margin:24px 0;">
            <p>
              <strong>Renter:</strong>
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
              <strong>Desired Move-In Date:</strong>
              ${escapeHtml(
                formattedMoveInDate
              )}
            </p>

            <p>
              <strong>Occupants:</strong>
              ${escapeHtml(
                Number(occupants) || 1
              )}
            </p>

            ${
              message
                ? `
                  <p>
                    <strong>Renter Message:</strong><br/>
                    ${escapeHtml(
                      message
                    ).replaceAll(
                      "\n",
                      "<br/>"
                    )}
                  </p>
                `
                : ""
            }
          </div>

          <p>
            Log in to your HubEthio Housing Workspace
            to review and manage this inquiry.
          </p>

          <div style="text-align:center;margin:28px 0;">
            <a
              href="https://hubethio.com/owner/workspaces/housing"
              style="display:inline-block;background:#1d4ed8;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;"
            >
              Open Housing Workspace
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
      "Housing owner notification email failed:",
      emailErr
    );
  }
}

try {
  const formattedMoveInDate =
    new Date(
      desiredMoveInDate
    ).toLocaleDateString(
      "en-US",
      {
        timeZone: "UTC",
      }
    );

  await sendEmail({
    to: customerEmail,

    subject:
      `Your Housing inquiry was received: ${listing.title}`,

    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
        <h1 style="color:#1d4ed8;">
          Housing Inquiry Received
        </h1>

        <p>
          Hello ${escapeHtml(customerName)},
        </p>

        <p>
          Your inquiry was successfully sent to
          <strong>${escapeHtml(
            listing.title
          )}</strong>.
        </p>

        <div style="background:#f8fafc;border:1px solid #dbe4ef;border-radius:12px;padding:20px;margin:24px 0;">
          <p>
            <strong>Desired Move-In Date:</strong>
            ${escapeHtml(
              formattedMoveInDate
            )}
          </p>

          <p>
            <strong>Occupants:</strong>
            ${escapeHtml(
              Number(occupants) || 1
            )}
          </p>

          ${
            message
              ? `
                <p>
                  <strong>Your Message:</strong><br/>
                  ${escapeHtml(
                    message
                  ).replaceAll(
                    "\n",
                    "<br/>"
                  )}
                </p>
              `
              : ""
          }
        </div>

        <p>
          This inquiry has been sent to the property owner.
          The owner may contact you directly regarding
          availability and next steps.
        </p>

        <p style="color:#64748b;font-size:13px;">
          HubEthio Business Services
        </p>
      </div>
    `,
  });
} catch (emailErr) {
  console.error(
    "Housing customer confirmation email failed:",
    emailErr
  );
}

    return res.status(201).json({
      message:
        "Housing inquiry submitted successfully.",
      inquiry,
    });
  } catch (err) {
    console.error(
      "Create Housing inquiry error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Housing inquiry.",
    });
  }
});

/*
  OWNER
  Get inquiries for logged-in Housing owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const inquiries =
        await HousingInquiry.find({
          ownerId: req.owner.id,
        })
          .populate(
            "listingId",
            "title city state status availabilityStatus"
          )
          .sort({ createdAt: -1 });

      return res.json(inquiries);
    } catch (err) {
      console.error(
        "Load Housing owner inquiries error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Housing inquiries.",
      });
    }
  }
);

/*
  OWNER
  Update Housing inquiry status
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
        "Contacted",
        "Approved",
        "Declined",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Housing inquiry status.",
        });
      }

      const inquiry =
        await HousingInquiry.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!inquiry) {
        return res.status(404).json({
          message:
            "Housing inquiry not found.",
        });
      }

      inquiry.status = status;
      inquiry.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

      if (status === "Contacted") {
        inquiry.contactedAt = now;
      }

      if (status === "Approved") {
        inquiry.approvedAt = now;
      }

      if (status === "Declined") {
        inquiry.declinedAt = now;
      }

      if (status === "Closed") {
        inquiry.closedAt = now;
      }

      await inquiry.save();

      await inquiry.populate(
        "listingId",
        "title city state status availabilityStatus"
      );

      if (
  inquiry.customerEmail &&
  status !== "New"
) {
  try {
    const businessTitle =
      inquiry.listingId?.title ||
      "Housing listing";

    const statusMessages = {
      Contacted:
        "The property owner has contacted or attempted to contact you about your housing inquiry.",

      Approved:
        "Your housing inquiry has been approved by the property owner.",

      Declined:
        "Your housing inquiry was declined by the property owner.",

      Closed:
        "Your housing inquiry has been closed.",
    };

    const statusMessage =
      statusMessages[status] ||
      `Your housing inquiry status is now ${status}.`;

    const formattedMoveInDate =
      inquiry.desiredMoveInDate
        ? new Date(
            inquiry.desiredMoveInDate
          ).toLocaleDateString(
            "en-US",
            {
              timeZone: "UTC",
            }
          )
        : "Not provided";

    await sendEmail({
      to: inquiry.customerEmail,

      subject:
        `Housing inquiry ${status}: ${businessTitle}`,

      html: `
        <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:24px;color:#111827;">
          <h1 style="color:#1d4ed8;">
            Housing Inquiry ${escapeHtml(status)}
          </h1>

          <p>
            Hello ${escapeHtml(
              inquiry.customerName
            )},
          </p>

          <p>
            ${escapeHtml(statusMessage)}
          </p>

          <p>
            Property:
            <strong>
              ${escapeHtml(businessTitle)}
            </strong>
          </p>

          <div style="background:#f8fafc;border:1px solid #dbe4ef;border-radius:12px;padding:20px;margin:24px 0;">
            <p>
              <strong>Desired Move-In Date:</strong>
              ${escapeHtml(
                formattedMoveInDate
              )}
            </p>

            <p>
              <strong>Occupants:</strong>
              ${escapeHtml(
                inquiry.occupants || 1
              )}
            </p>

            ${
              inquiry.ownerNotes
                ? `
                  <p>
                    <strong>Owner Notes:</strong><br/>
                    ${escapeHtml(
                      inquiry.ownerNotes
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
            status === "Approved"
              ? `
                <p>
                  Please contact the property owner directly
                  to discuss the next steps, availability,
                  lease terms, and move-in arrangements.
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
      "Housing status notification email failed:",
      emailErr
    );
  }
}

      return res.json({
        message:
          "Housing inquiry status updated successfully.",
        inquiry,
      });
    } catch (err) {
      console.error(
        "Update Housing inquiry status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Housing inquiry status.",
      });
    }
  }
);

export default router;