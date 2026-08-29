import express from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";

import User from "../models/User.js";
import {
  requireAdmin,
  requireRole,
} from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post(
  "/",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin"
  ),
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

const activationUrl = `${process.env.CLIENT_URL || "https://www.hubethio.com"}/owner/activate/${rawActivationToken}`;

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
          <table
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  border="0"
  align="center"
  style="
    margin:0 auto 16px;
    border-collapse:separate;
  "
>
  <tr>
    <td
      width="68"
      height="68"
      align="center"
      valign="middle"
      style="
        width:68px;
        height:68px;
        border:2px solid #ffffff;
        border-radius:50%;
        font-size:22px;
        font-weight:900;
        line-height:68px;
        text-align:center;
        vertical-align:middle;
        color:#ffffff;
      "
    >
      HE
    </td>
  </tr>
</table>

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

router.post(
  "/resend",
  requireAdmin,
  requireRole(
    "super_admin",
    "operations_admin"
  ),
  async (req, res) => {
    try {
      const { email } = req.body || {};

      if (!email) {
        return res.status(400).json({
          message: "Owner email is required.",
        });
      }

      const normalizedEmail =
        String(email).trim().toLowerCase();

      const user = await User.findOne({
        email: normalizedEmail,
        role: "owner",
      });

      if (!user) {
        return res.status(404).json({
          message: "Owner account not found.",
        });
      }

      if (user.accountStatus !== "invited") {
        return res.status(400).json({
          message:
            "This owner account is already active.",
        });
      }

      const rawActivationToken =
        crypto.randomBytes(32).toString("hex");

      const hashedActivationToken =
        crypto
          .createHash("sha256")
          .update(rawActivationToken)
          .digest("hex");

      user.activationToken =
        hashedActivationToken;

      user.activationExpires =
        new Date(
          Date.now() +
            1000 * 60 * 60 * 24
        );

      await user.save();

      const activationUrl =
        `${process.env.CLIENT_URL || "https://www.hubethio.com"}/owner/activate/${rawActivationToken}`;

      const emailResult = await sendEmail({
        to: user.email,
        subject:
          "Activate Your HubEthio Owner Account",
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
                <table
  role="presentation"
  cellpadding="0"
  cellspacing="0"
  border="0"
  align="center"
  style="
    margin:0 auto 16px;
    border-collapse:separate;
  "
>
  <tr>
    <td
      width="68"
      height="68"
      align="center"
      valign="middle"
      style="
        width:68px;
        height:68px;
        border:2px solid #ffffff;
        border-radius:50%;
        font-size:22px;
        font-weight:900;
        line-height:68px;
        text-align:center;
        vertical-align:middle;
        color:#ffffff;
      "
    >
      HE
    </td>
  </tr>
</table>

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
                  Activate your account and choose
                  your own password.
                </p>
              </div>

              <div style="padding:30px 28px;">
                <p style="
                  font-size:17px;
                  margin-top:0;
                ">
                  Hello ${user.name},
                </p>

                <p style="
                  font-size:15px;
                  line-height:1.7;
                  color:#4b5563;
                ">
                  You've been invited to manage your
                  business on HubEthio. Your owner
                  account is ready for activation.
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
                    Click the activation button below,
                    choose your password, and then sign
                    in to your HubEthio Owner Dashboard.
                  </p>
                </div>

                <div style="
                  text-align:center;
                  margin:30px 0;
                ">
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
                  This new activation link expires
                  in 24 hours.
                </p>

                <p style="
                  font-size:14px;
                  line-height:1.6;
                  color:#6b7280;
                ">
                  If you were not expecting this
                  invitation, you can ignore this email.
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

      if (!emailResult) {
        return res.status(500).json({
          message:
            "A new activation link was created, but the email could not be sent.",
        });
      }

      return res.json({
        message:
          "Owner activation email resent successfully.",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          accountStatus: user.accountStatus,
          activationExpires:
            user.activationExpires,
        },
      });
    } catch (err) {
      console.error(
        "Resend owner activation error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to resend owner activation email.",
      });
    }
  }
);

export default router;