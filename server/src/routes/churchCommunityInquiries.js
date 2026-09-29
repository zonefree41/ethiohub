import express from "express";
import mongoose from "mongoose";
import ChurchCommunityInquiry from "../models/ChurchCommunityInquiry.js";
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

function churchCommunityEmailLayout({
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
  Create a new Church / Community inquiry
*/
router.post("/", async (req, res) => {
  try {
    const {
      listingId,
      customerName,
      customerEmail,
      customerPhone,
      inquiryType,
      preferredContactMethod = "Either",
      message,
    } = req.body;

    if (
      !listingId ||
      !customerName ||
      !customerEmail ||
      !customerPhone ||
      !inquiryType ||
      !message
    ) {
      return res.status(400).json({
        message:
          "Please provide all required Church / Community inquiry information.",
      });
    }

    if (
      typeof listingId !== "string" ||
      !mongoose.Types.ObjectId.isValid(listingId.trim())
    ) {
      return res.status(400).json({
        message: "Invalid listing ID.",
      });
    }

    const allowedContactMethods = [
      "Phone",
      "Email",
      "Either",
    ];

    if (
      !allowedContactMethods.includes(
        preferredContactMethod
      )
    ) {
      return res.status(400).json({
        message:
          "Invalid preferred contact method.",
      });
    }

    const listing = await Listing.findById(
      listingId
    )
      .populate("ownerId", "email")
      .populate("categoryId", "slug");

    if (!listing) {
      return res.status(404).json({
        message:
          "Church / Community organization not found.",
      });
    }

    if (listing.status !== "approved") {
      return res.status(400).json({
        message:
          "This Church / Community organization is not currently available for inquiries.",
      });
    }

    if (
      listing.categoryId?.slug !==
      "church-community"
    ) {
      return res.status(400).json({
        message:
          "This listing is not a Church / Community organization.",
      });
    }

    if (!listing.ownerId) {
      return res.status(400).json({
        message:
          "This listing does not have an assigned owner.",
      });
    }

    const inquiry =
      await ChurchCommunityInquiry.create({
        listingId: listing._id,
        ownerId: listing.ownerId._id,
        customerName,
        customerEmail,
        customerPhone,
        inquiryType,
        preferredContactMethod,
        message,
      });

    const ownerEmail = listing.ownerId?.email;

    if (ownerEmail) {
      try {
        await sendEmail({
          to: ownerEmail,
          subject:
            `New Church / Community inquiry: ${listing.title}`,
          html: churchCommunityEmailLayout({
            title: "New Church / Community Inquiry",
            subtitle:
              "A community member is waiting for your response.",
            badge: "New Inquiry",
            content: `
              <p style="margin:0 0 8px;font-size:16px;line-height:1.6;">
                You received a new inquiry for
                <strong>${escapeHtml(listing.title)}</strong>.
              </p>

              <p style="margin:0 0 22px;color:#64748b;font-size:14px;line-height:1.6;">
                Review the details below, then open your Church &amp; Community Workspace to manage the inquiry.
              </p>

              <div style="background:#fff8fb;border:1px solid #eadce5;border-radius:14px;padding:20px;">
                <p style="margin:0 0 12px;line-height:1.5;">
                  <strong>Name:</strong><br/>
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
                  <strong>Inquiry Type:</strong><br/>
                  ${escapeHtml(inquiryType)}
                </p>

                <p style="margin:0 0 12px;line-height:1.5;">
                  <strong>Preferred Contact:</strong><br/>
                  ${escapeHtml(preferredContactMethod)}
                </p>

                <p style="margin:0;line-height:1.6;">
                  <strong>Message:</strong><br/>
                  ${escapeHtml(message).replaceAll(
                    "\n",
                    "<br/>"
                  )}
                </p>
              </div>

              <div style="text-align:center;margin:28px 0 18px;">
                <a
                  href="${"https:" + "//" + "hubethio.com" + "/owner/workspaces/church-community"}"
                  style="display:inline-block;background:#7a2459;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-size:15px;font-weight:700;"
                >
                  Open Church &amp; Community Workspace
                </a>
              </div>

              <p style="margin:0;text-align:center;color:#64748b;font-size:13px;line-height:1.6;">
                Sign in to HubEthio to review and manage this inquiry.
              </p>
            `,
          }),
        });
      } catch (emailErr) {
        console.error(
          "Church / Community owner notification email failed:",
          emailErr
        );
      }
    }

    try {
      await sendEmail({
        to: customerEmail,
        subject:
          `Your inquiry was received: ${listing.title}`,
        html: churchCommunityEmailLayout({
          title: "Church / Community Inquiry Received",
          subtitle:
            "Your inquiry has been sent to the organization.",
          badge: "Inquiry Received",
          content: `
            <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
              Hello ${escapeHtml(customerName)},
            </p>

            <p style="margin:0 0 22px;font-size:15px;line-height:1.7;">
              Your inquiry was successfully sent to
              <strong>${escapeHtml(listing.title)}</strong>.
            </p>

            <div style="background:#fff8fb;border:1px solid #eadce5;border-radius:14px;padding:20px;">
              <p style="margin:0 0 12px;line-height:1.5;">
                <strong>Inquiry Type:</strong><br/>
                ${escapeHtml(inquiryType)}
              </p>

              <p style="margin:0 0 12px;line-height:1.5;">
                <strong>Preferred Contact:</strong><br/>
                ${escapeHtml(preferredContactMethod)}
              </p>

              <p style="margin:0;line-height:1.6;">
                <strong>Your Message:</strong><br/>
                ${escapeHtml(message).replaceAll(
                  "\n",
                  "<br/>"
                )}
              </p>
            </div>

            <div style="background:#f8fafc;border-left:4px solid #7a2459;border-radius:8px;padding:16px 18px;margin-top:22px;">
              <p style="margin:0;font-size:14px;line-height:1.6;color:#475569;">
                <strong style="color:#1f2937;">What happens next?</strong><br/>
                The organization has received your inquiry and can contact you using your preferred contact method.
              </p>
            </div>

            <p style="margin:22px 0 0;text-align:center;color:#64748b;font-size:13px;line-height:1.6;">
              Thank you for using HubEthio to connect with local community organizations.
            </p>
          `,
        }),
      });
    } catch (emailErr) {
      console.error(
        "Church / Community customer confirmation email failed:",
        emailErr
      );
    }

    return res.status(201).json({
      message:
        "Church / Community inquiry submitted successfully.",
      inquiry,
    });
  } catch (err) {
    console.error(
      "Create Church / Community inquiry error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to submit Church / Community inquiry.",
    });
  }
});



/*
  OWNER
  Get Church / Community inquiries for logged-in owner
*/
router.get(
  "/owner",
  requireOwner,
  async (req, res) => {
    try {
      const inquiries =
        await ChurchCommunityInquiry.find({
          ownerId: req.owner.id,
        })
          .populate(
            "listingId",
            "title city state status"
          )
          .sort({ createdAt: -1 });

      return res.json(inquiries);
    } catch (err) {
      console.error(
        "Load Church / Community owner inquiries error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to load Church / Community inquiries.",
      });
    }
  }
);



/*
  OWNER
  Update Church / Community inquiry status
*/
router.patch(
  "/:id/status",
  requireOwner,
  async (req, res) => {
    try {
      const { status, ownerNotes = "" } = req.body;

      const allowedStatuses = [
        "New",
        "Contacted",
        "Resolved",
        "Closed",
      ];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message:
            "Invalid Church / Community inquiry status.",
        });
      }

      const inquiry =
        await ChurchCommunityInquiry.findOne({
          _id: req.params.id,
          ownerId: req.owner.id,
        });

      if (!inquiry) {
        return res.status(404).json({
          message:
            "Church / Community inquiry not found.",
        });
      }

      inquiry.status = status;
      inquiry.ownerNotes =
        String(ownerNotes || "").trim();

      const now = new Date();

      if (status === "Contacted") {
        inquiry.contactedAt = now;
      }

      if (status === "Resolved") {
        inquiry.resolvedAt = now;
      }

      if (status === "Closed") {
        inquiry.closedAt = now;
      }

      await inquiry.save();

      await inquiry.populate(
        "listingId",
        "title city state status"
      );

      if (
        inquiry.customerEmail &&
        status !== "New"
      ) {
        try {
          const organizationTitle =
            inquiry.listingId?.title ||
            "Church / Community organization";

          const statusMessages = {
            Contacted:
              "The organization has marked your inquiry as contacted.",
            Resolved:
              "Your Church / Community inquiry has been marked as resolved.",
            Closed:
              "Your Church / Community inquiry has been closed.",
          };

          const statusMessage =
            statusMessages[status] ||
            `Your Church / Community inquiry status is now ${status}.`;

          await sendEmail({
            to: inquiry.customerEmail,
            subject:
              `Church / Community inquiry ${status}: ${organizationTitle}`,
            html: churchCommunityEmailLayout({
              title:
                `Church / Community Inquiry ${escapeHtml(status)}`,
              subtitle:
                escapeHtml(statusMessage),
              badge: escapeHtml(status),
              content: `
                <p style="margin:0 0 12px;font-size:16px;line-height:1.6;">
                  Hello ${escapeHtml(inquiry.customerName)},
                </p>

                <p style="margin:0 0 22px;font-size:15px;line-height:1.7;">
                  ${escapeHtml(statusMessage)}
                </p>

                <div style="background:#fff8fb;border:1px solid #eadce5;border-radius:14px;padding:20px;">
                  <p style="margin:0 0 12px;line-height:1.5;">
                    <strong>Organization:</strong><br/>
                    ${escapeHtml(organizationTitle)}
                  </p>

                  <p style="margin:0 0 12px;line-height:1.5;">
                    <strong>Inquiry Type:</strong><br/>
                    ${escapeHtml(inquiry.inquiryType)}
                  </p>

                  <p style="margin:0;line-height:1.6;">
                    <strong>Your Message:</strong><br/>
                    ${escapeHtml(inquiry.message).replaceAll(
                      "\n",
                      "<br/>"
                    )}
                  </p>

                  ${
                    inquiry.ownerNotes
                      ? `
                        <div style="border-top:1px solid #eadce5;margin-top:18px;padding-top:18px;">
                          <p style="margin:0;line-height:1.6;">
                            <strong>Organization Notes:</strong><br/>
                            ${escapeHtml(
                              inquiry.ownerNotes
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
              `,
            }),
          });
        } catch (emailErr) {
          console.error(
            "Church / Community status notification email failed:",
            emailErr
          );
        }
      }

      return res.json({
        message:
          "Church / Community inquiry status updated successfully.",
        inquiry,
      });
    } catch (err) {
      console.error(
        "Update Church / Community inquiry status error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to update Church / Community inquiry status.",
      });
    }
  }
);


export default router;
