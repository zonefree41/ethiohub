import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AdminUser from "../models/AdminUser.js";
import Listing from "../models/Listing.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email/password required" });
    }

    const admin = await AdminUser.findOne({ email: email.toLowerCase() });

    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, admin.passwordHash);

    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    res.json({ token });
  } catch (err) {
    console.error("Admin login failed:", err);
    res.status(500).json({ message: "Admin login failed" });
  }
});

// Pending / approved / rejected submissions
router.get("/submissions", requireAdmin, async (req, res) => {
  try {
    const status = req.query.status || "pending";

    const items = await Listing.find({ status })
      .populate("categoryId")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(items);
  } catch (err) {
    console.error("Load submissions failed:", err);
    res.status(500).json({ message: "Failed to load submissions" });
  }
});

router.patch("/listings/:id", async (req, res) => {
  try {
    const allowedFields = [
      "title",
      "description_en",
      "description_am",
      "phone",
      "whatsapp",
      "website",
      "address",
      "city",
      "state",
      "zip",
      "businessHours",
      "logoUrl",
      "imageUrl",
      "categoryId",
      "subcategory",
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (field in req.body) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedAt = new Date();

    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    ).populate("categoryId");

    if (!listing) {
      return res.status(404).json({ message: "Listing not found" });
    }

    res.json(listing);
  } catch (err) {
    console.error("Admin update listing failed:", err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

// Approve / reject / edit listing
router.patch("/listings/:id", requireAdmin, async (req, res) => {
  try {
    const patch = req.body || {};

    const existing = await Listing.findById(req.params.id);

    if (!existing) {
      return res.status(404).json({ message: "Not found" });
    }

    const isBeingApproved =
      patch.status === "approved" && existing.status !== "approved";

    if (isBeingApproved && !existing.trialStartedAt && !existing.hasUsedTrial) {
      const now = new Date();

      const trialEndsAt = new Date(
        now.getTime() + 3 * 24 * 60 * 60 * 1000
      );

      patch.paymentStatus = "trial";
      patch.isFeatured = true;
      patch.isVerified = true;
      patch.trialStartedAt = now;
      patch.trialEndsAt = trialEndsAt;
      patch.hasUsedTrial = true;
    }

    const updated = await Listing.findByIdAndUpdate(req.params.id, patch, {
      new: true,
    }).populate("categoryId");

    if (!updated) {
      return res.status(404).json({ message: "Not found" });
    }

    const shouldSendApprovalEmail =
  isBeingApproved &&
  !existing.approvalEmailSentAt &&
  !existing.hasUsedTrial;

if (shouldSendApprovalEmail) {
      const ownerName = updated.submittedBy?.name || "there";
      const ownerEmail = updated.submittedBy?.contact;

      if (ownerEmail && ownerEmail.includes("@")) {
        await sendEmail({
          to: ownerEmail,
          subject: `Your HubEthio listing is approved: ${updated.title}`,
          html: `
  <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
    <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">

      <!-- HEADER -->
      <div style="background:#0f172a;padding:35px 30px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:32px;">
          HubEthio
        </h1>

        <p style="color:#cbd5e1;margin-top:10px;font-size:15px;">
          Ethiopian Community Business Platform
        </p>
      </div>

      <!-- BODY -->
      <div style="padding:40px 32px;color:#111827;line-height:1.7;">

        <h2 style="margin-top:0;font-size:28px;color:#111827;">
          🎉 Your Listing Is Now Live
        </h2>

        <p style="font-size:17px;">
          Hi <strong>${ownerName}</strong>,
        </p>

        <p style="font-size:16px;">
          Your business listing
          <strong>${updated.title}</strong>
          has officially been approved and published on
          <strong>HubEthio</strong>.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:30px 0;">

          <h3 style="margin-top:0;color:#0f172a;">
            🚀 Free Featured Trial Activated
          </h3>

          <p style="margin-bottom:12px;">
            Your listing is currently receiving:
          </p>

          <ul style="padding-left:20px;margin:0;">
            <li>✅ Featured visibility</li>
            <li>✅ Verified badge</li>
            <li>✅ Higher search placement</li>
            <li>✅ Increased customer exposure</li>
          </ul>

          ${
            updated.trialEndsAt
              ? `
              <p style="margin-top:18px;font-weight:bold;color:#dc2626;">
                Trial Ends: ${new Date(
                  updated.trialEndsAt
                ).toLocaleDateString()}
              </p>
            `
              : ""
          }
        </div>

        <p style="font-size:16px;">
          You can now manage your listing, view analytics,
          and track customer activity directly from your owner dashboard.
        </p>

        <!-- BUTTON -->
        <div style="text-align:center;margin:40px 0;">
          <a
            href="https://www.hubethio.com/owner/dashboard"
            style="
              background:#f59e0b;
              color:#ffffff;
              text-decoration:none;
              padding:16px 28px;
              border-radius:10px;
              display:inline-block;
              font-size:16px;
              font-weight:bold;
            "
          >
            Open Owner Dashboard
          </a>
        </div>

        <div style="border-top:1px solid #e5e7eb;padding-top:25px;margin-top:35px;">

          <p style="margin:0;font-size:15px;color:#6b7280;">
            Thank you for joining HubEthio.
          </p>

          <p style="margin-top:10px;font-size:15px;color:#6b7280;">
            We're excited to help your business reach more customers in the Ethiopian community.
          </p>

          <p style="margin-top:25px;font-size:14px;color:#9ca3af;">
            — HubEthio Team<br/>
            support@hubethio.com
          </p>

        </div>

      </div>
    </div>
  </div>
`,
        });
         updated.approvalEmailSentAt = new Date();
  await updated.save();
      }
    }

    res.json(updated);
  } catch (err) {
    console.error("Admin listing update failed:", err);
    res.status(500).json({ message: "Failed to update listing" });
  }
});

// Delete listing
router.delete("/listings/:id", requireAdmin, async (req, res) => {
  try {
    const deleted = await Listing.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("Delete listing failed:", err);
    res.status(500).json({ message: "Failed to delete listing" });
  }
});

export default router;