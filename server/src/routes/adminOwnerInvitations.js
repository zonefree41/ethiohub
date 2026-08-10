import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post(
  "/",
  requireAdmin,
  async (req, res) => {
    try {
      const {
        name,
        email,
      } = req.body || {};

      if (!name || !email) {
        return res.status(400).json({
          message:
            "Owner name and email are required.",
        });
      }

      const normalizedEmail =
        String(email).trim().toLowerCase();

      const existingUser =
        await User.findOne({
          email: normalizedEmail,
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "An account with this email already exists.",
          user: {
            id: existingUser._id,
            name: existingUser.name,
            email: existingUser.email,
            role: existingUser.role,
            accountStatus:
              existingUser.accountStatus,
          },
        });
      }

      const rawActivationToken =
  crypto.randomBytes(32).toString("hex");

const hashedActivationToken =
  crypto
    .createHash("sha256")
    .update(rawActivationToken)
    .digest("hex");

const placeholderPassword =
  crypto.randomBytes(48).toString("hex");

const passwordHash =
  await bcrypt.hash(
    placeholderPassword,
    10
  );

const user = await User.create({
  name: String(name).trim(),
  email: normalizedEmail,
  passwordHash,
  role: "owner",
  accountStatus: "invited",
  activationToken:
    hashedActivationToken,
  activationExpires:
    new Date(
      Date.now() +
      1000 * 60 * 60 * 24
    ),
});

const activationUrl = `${
  process.env.CLIENT_URL || "https://www.hubethio.com"
}/owner/activate/${rawActivationToken}`;

await sendEmail({
  to: user.email,
  subject: "Activate Your HubEthio Owner Account",
  html: `
    <div style="
      margin:0;
      padding:32px 16px;
      background:#f7f7fb;
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
          background:linear-gradient(135deg,#7c3aed,#c084fc);
          color:#ffffff;
        ">
          <div style="font-size:38px;margin-bottom:10px;">
            ✨
          </div>

          <h1 style="
            margin:0;
            font-size:27px;
          ">
            Your HubEthio Owner Account Is Ready
          </h1>

          <p style="
            margin:10px 0 0;
            opacity:.95;
            line-height:1.6;
          ">
            Activate your account and choose your own password.
          </p>
        </div>

        <div style="padding:30px 28px;">
          <p style="font-size:17px;margin-top:0;">
            Hello ${user.name},
          </p>

          <p style="
            font-size:15px;
            line-height:1.7;
            color:#4b5563;
          ">
            You've been invited to manage your business on HubEthio.
            Your owner account has been prepared using this email address.
          </p>

          <div style="
            margin:24px 0;
            padding:18px;
            background:#faf5ff;
            border:1px solid #e9d5ff;
            border-radius:14px;
          ">
            <strong style="color:#6b21a8;">
              What happens next
            </strong>

            <p style="
              margin:8px 0 0;
              font-size:14px;
              line-height:1.7;
              color:#4b5563;
            ">
              Click the activation button below, choose your password,
              and then sign in to your HubEthio Owner Dashboard.
            </p>
          </div>

          <div style="text-align:center;margin:30px 0;">
            <a
              href="${activationUrl}"
              style="
                display:inline-block;
                background:#7c3aed;
                color:#ffffff;
                text-decoration:none;
                padding:14px 24px;
                border-radius:10px;
                font-weight:800;
              "
            >
              Activate My Owner Account
            </a>
          </div>

          <p style="
            font-size:14px;
            line-height:1.6;
            color:#6b7280;
          ">
            This activation link expires in 24 hours.
          </p>

          <p style="
            font-size:14px;
            line-height:1.6;
            color:#6b7280;
          ">
            If you were not expecting this invitation, you can ignore this email.
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

return res.status(201).json({
  message:
    "Owner invitation created successfully.",
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus:
      user.accountStatus,
  },
});
    } catch (err) {
      console.error(
        "Create owner invitation error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to create owner invitation.",
      });
    }
  }
);

export default router;