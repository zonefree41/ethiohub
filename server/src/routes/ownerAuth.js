import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

const rawVerificationToken =
  crypto.randomBytes(32).toString("hex");

const hashedVerificationToken = crypto
  .createHash("sha256")
  .update(rawVerificationToken)
  .digest("hex");

const user = await User.create({
  name,
  email: email.toLowerCase(),
  passwordHash,
  role: "owner",
  accountStatus: "pending_verification",
  activationToken: hashedVerificationToken,
  activationExpires: new Date(
    Date.now() + 24 * 60 * 60 * 1000
  ),
});

const verificationUrl = `${
  process.env.SERVER_URL ||
  "https://ethiohub.onrender.com"
}/api/owner/auth/verify-email?token=${rawVerificationToken}`;

    try {
  await sendEmail({
    to: user.email,
    subject: "Verify your HubEthio email",
    html: `
  <div style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
    color:#111827;
  ">
    <div style="
      max-width:640px;
      margin:0 auto;
      padding:32px 16px;
    ">

      <div style="
        background:linear-gradient(135deg,#0f172a,#92400e);
        border-radius:24px 24px 0 0;
        padding:36px 28px;
        text-align:center;
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
        border:2px solid #f59e0b;
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
          font-size:30px;
          line-height:1.2;
        ">
          Verify Your HubEthio Email
        </h1>

        <p style="
          margin:12px 0 0;
          font-size:16px;
          line-height:1.6;
          color:#f8fafc;
        ">
          One quick step before you access your Business Owner account.
        </p>
      </div>

      <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-top:none;
        border-radius:0 0 24px 24px;
        padding:32px 28px;
      ">
        <p style="
          margin:0 0 16px;
          font-size:16px;
          line-height:1.7;
        ">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="
          margin:0 0 18px;
          font-size:16px;
          line-height:1.7;
          color:#374151;
        ">
          Thank you for creating a HubEthio Business Owner account.
          Please verify your email address before signing in and
          managing your business.
        </p>

        <div style="
          background:#fff7ed;
          border:1px solid #fed7aa;
          border-radius:16px;
          padding:18px;
          margin:22px 0;
        ">
          <p style="
            margin:0;
            color:#9a3412;
            font-size:15px;
            line-height:1.6;
            font-weight:700;
          ">
            This verification link expires in 24 hours.
          </p>
        </div>

        <div style="
          text-align:center;
          margin:30px 0;
        ">
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              background:#f59e0b;
              color:#111827;
              text-decoration:none;
              font-weight:900;
              padding:15px 28px;
              border-radius:14px;
              font-size:16px;
              box-shadow:0 8px 20px rgba(245,158,11,0.25);
            "
          >
            Verify Email Address
          </a>
        </div>

        <p style="
          margin:0 0 14px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
        ">
          If the button does not work, copy and paste the verification
          link into your browser.
        </p>

        <p style="
          margin:0 0 18px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
          word-break:break-all;
        ">
          ${verificationUrl}
        </p>

        <p style="
          margin:0 0 16px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
        ">
          If you did not create this account, you can safely ignore
          this email.
        </p>

        <p style="
          margin:0;
          font-size:15px;
          line-height:1.7;
          color:#374151;
        ">
          — The HubEthio Team
        </p>

        <hr style="
          border:none;
          border-top:1px solid #e5e7eb;
          margin:28px 0;
        " />

        <p style="
          margin:0;
          text-align:center;
          font-size:13px;
          line-height:1.6;
          color:#9ca3af;
        ">
          HubEthio<br />
          Connecting businesses, services, and communities.
        </p>
      </div>

    </div>
  </div>
`,
  });
} catch (emailErr) {
  console.error("⚠️ Welcome email failed:", emailErr.message);
}

    res.status(201).json({
  message:
    "Account created. Please check your email and verify your account before signing in.",
  requiresEmailVerification: true,
  user: {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    accountStatus: user.accountStatus,
  },
});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
});

router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query || {};

    if (!token) {
      return res.status(400).send(
        "Verification token is required."
      );
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      activationToken: hashedToken,
      activationExpires: { $gt: new Date() },
      accountStatus: "pending_verification",
    });

    if (!user) {
      return res.status(400).send(
        "This verification link is invalid or has expired."
      );
    }

    user.accountStatus = "active";
    user.activationToken = "";
    user.activationExpires = null;

    await user.save();

    const clientUrl =
      process.env.CLIENT_URL ||
      "https://www.hubethio.com";

    return res.redirect(
      `${clientUrl}/owner/login?verified=1`
    );
  } catch (err) {
    console.error(
      "Owner email verification error:",
      err
    );

    return res.status(500).send(
      "Unable to verify email address."
    );
  }
});

router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const normalizedEmail =
      String(email).trim().toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
      role: "owner",
    });

    // Do not reveal whether the account exists
    if (
      !user ||
      user.accountStatus !== "pending_verification"
    ) {
      return res.json({
        message:
          "If an unverified account exists, a new verification email has been sent.",
      });
    }

    const rawVerificationToken =
      crypto.randomBytes(32).toString("hex");

    const hashedVerificationToken = crypto
      .createHash("sha256")
      .update(rawVerificationToken)
      .digest("hex");

    user.activationToken =
      hashedVerificationToken;

    user.activationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    await user.save();

    const verificationUrl = `${
      process.env.SERVER_URL ||
      "https://ethiohub.onrender.com"
    }/api/owner/auth/verify-email?token=${rawVerificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your HubEthio email",
      html: `
  <div style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
    color:#111827;
  ">
    <div style="
      max-width:640px;
      margin:0 auto;
      padding:32px 16px;
    ">

      <div style="
        background:linear-gradient(135deg,#0f172a,#92400e);
        border-radius:24px 24px 0 0;
        padding:36px 28px;
        text-align:center;
        color:#ffffff;
      ">
        <div style="
          width:68px;
          height:68px;
          margin:0 auto 16px;
          border-radius:50%;
          border:2px solid #f59e0b;
          display:flex;
          align-items:center;
          justify-content:center;
          font-size:22px;
          font-weight:900;
        ">
          HE
        </div>

        <h1 style="
          margin:0;
          font-size:30px;
          line-height:1.2;
        ">
          Verify Your HubEthio Email
        </h1>

        <p style="
          margin:12px 0 0;
          font-size:16px;
          line-height:1.6;
          color:#f8fafc;
        ">
          Here is your new verification link.
        </p>
      </div>

      <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-top:none;
        border-radius:0 0 24px 24px;
        padding:32px 28px;
      ">
        <p style="
          margin:0 0 16px;
          font-size:16px;
          line-height:1.7;
        ">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="
          margin:0 0 18px;
          font-size:16px;
          line-height:1.7;
          color:#374151;
        ">
          You requested a new verification link for your
          HubEthio Business Owner account.
        </p>

        <div style="
          background:#fff7ed;
          border:1px solid #fed7aa;
          border-radius:16px;
          padding:18px;
          margin:22px 0;
        ">
          <p style="
            margin:0;
            color:#9a3412;
            font-size:15px;
            line-height:1.6;
            font-weight:700;
          ">
            This verification link expires in 24 hours.
          </p>
        </div>

        <div style="
          text-align:center;
          margin:30px 0;
        ">
          <a
            href="${verificationUrl}"
            style="
              display:inline-block;
              background:#f59e0b;
              color:#111827;
              text-decoration:none;
              font-weight:900;
              padding:15px 28px;
              border-radius:14px;
              font-size:16px;
              box-shadow:0 8px 20px rgba(245,158,11,0.25);
            "
          >
            Verify Email Address
          </a>
        </div>

        <p style="
          margin:0 0 14px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
        ">
          If the button does not work, copy and paste the verification
          link into your browser.
        </p>

        <p style="
          margin:0 0 18px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
          word-break:break-all;
        ">
          ${verificationUrl}
        </p>

        <p style="
          margin:0 0 16px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
        ">
          If you did not request this verification email, you can safely
          ignore it.
        </p>

        <p style="
          margin:0;
          font-size:15px;
          line-height:1.7;
          color:#374151;
        ">
          — The HubEthio Team
        </p>

        <hr style="
          border:none;
          border-top:1px solid #e5e7eb;
          margin:28px 0;
        " />

        <p style="
          margin:0;
          text-align:center;
          font-size:13px;
          line-height:1.6;
          color:#9ca3af;
        ">
          HubEthio<br />
          Connecting businesses, services, and communities.
        </p>
      </div>

    </div>
  </div>
`,
    });

    return res.json({
      message:
        "If an unverified account exists, a new verification email has been sent.",
    });
  } catch (err) {
    console.error(
      "Resend verification email error:",
      err
    );

    return res.status(500).json({
      message:
        "Unable to resend verification email.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }


    const passwordOk = await bcrypt.compare(password, user.passwordHash);

    if (!passwordOk) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    if (
  user.accountStatus ===
  "pending_verification"
) {
  return res.status(403).json({
    message:
      "Please verify your email address before signing in.",
    requiresEmailVerification: true,
  });
}

if (user.accountStatus === "invited") {
  return res.status(403).json({
    message:
      "Please activate your owner account before signing in.",
  });
}

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    // Do not reveal whether account exists
    if (!user) {
      return res.json({
        message: "If an account exists, a reset link has been sent.",
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const hashedToken = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 1000 * 60 * 30); // 30 min

    await user.save();

    const resetUrl = `${process.env.CLIENT_URL || "https://www.hubethio.com"}/owner/reset-password/${rawToken}`;

    await sendEmail({
      to: user.email,
      subject: "Reset your HubEthio password",
      html: `
  <div style="
    margin:0;
    padding:0;
    background:#f4f6f8;
    font-family:Arial,Helvetica,sans-serif;
    color:#111827;
  ">
    <div style="
      max-width:640px;
      margin:0 auto;
      padding:32px 16px;
    ">

      <div style="
        background:linear-gradient(135deg,#0f172a,#92400e);
        border-radius:24px 24px 0 0;
        padding:36px 28px;
        text-align:center;
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
                border:2px solid #f59e0b;
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
          font-size:30px;
          line-height:1.2;
        ">
          Reset Your HubEthio Password
        </h1>

        <p style="
          margin:12px 0 0;
          font-size:16px;
          line-height:1.6;
          color:#f8fafc;
        ">
          Securely create a new password for your Business Owner account.
        </p>
      </div>

      <div style="
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-top:none;
        border-radius:0 0 24px 24px;
        padding:32px 28px;
      ">

        <p style="
          margin:0 0 16px;
          font-size:16px;
          line-height:1.7;
        ">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="
          margin:0 0 18px;
          font-size:16px;
          line-height:1.7;
          color:#374151;
        ">
          We received a request to reset the password for your
          HubEthio Business Owner account.
        </p>

        <div style="
          background:#fff7ed;
          border:1px solid #fed7aa;
          border-radius:16px;
          padding:18px;
          margin:22px 0;
        ">
          <p style="
            margin:0;
            color:#9a3412;
            font-size:15px;
            line-height:1.6;
            font-weight:700;
          ">
            This password reset link expires in 30 minutes.
          </p>
        </div>

        <div style="
          text-align:center;
          margin:30px 0;
        ">
          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              background:#f59e0b;
              color:#111827;
              text-decoration:none;
              font-weight:900;
              padding:15px 28px;
              border-radius:14px;
              font-size:16px;
            "
          >
            Reset Password
          </a>
        </div>

        <p style="
          margin:0 0 14px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
        ">
          If the button does not work, copy and paste this link into your browser.
        </p>

        <p style="
          margin:0 0 18px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
          word-break:break-all;
        ">
          ${resetUrl}
        </p>

        <p style="
          margin:0 0 16px;
          font-size:14px;
          line-height:1.7;
          color:#6b7280;
        ">
          If you did not request a password reset, you can safely ignore this email.
        </p>

        <p style="
          margin:0;
          font-size:15px;
          line-height:1.7;
          color:#374151;
        ">
          — The HubEthio Team
        </p>

      </div>
    </div>
  </div>
`,
    });

    res.json({
      message: "If an account exists, a reset link has been sent.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to process password reset request",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and new password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired reset link",
      });
    }

    user.passwordHash = await bcrypt.hash(password, 10);
    user.resetPasswordToken = "";
    user.resetPasswordExpires = null;

    await user.save();

    res.json({
      message: "Password reset successfully. You can now login.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Failed to reset password",
    });
  }
});

router.post("/activate-account", async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (!token || !password) {
      return res.status(400).json({
        message:
          "Activation token and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      activationToken: hashedToken,
      activationExpires: { $gt: new Date() },
      accountStatus: "invited",
    });

    if (!user) {
      return res.status(400).json({
        message:
          "Invalid or expired activation link",
      });
    }

    user.passwordHash =
      await bcrypt.hash(password, 10);

    user.accountStatus = "active";
    user.activationToken = "";
    user.activationExpires = null;

    await user.save();

    return res.json({
      message:
        "Owner account activated successfully. You can now login.",
    });
  } catch (err) {
    console.error(
      "Owner account activation error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to activate owner account",
    });
  }
});

router.delete(
  "/account",
  requireOwner,
  async (req, res) => {
    try {
      const user = await User.findById(
        req.owner.id
      );

      if (!user) {
        return res.status(404).json({
          message: "Account not found.",
        });
      }

      if (user.role !== "owner") {
        return res.status(403).json({
          message:
            "This account cannot be deleted through the owner account deletion flow.",
        });
      }

      // Preserve public business listings, but remove
      // their connection to the deleted owner account.
      await Listing.updateMany(
        {
          ownerId: user._id,
        },
        {
          $set: {
            ownerId: null,
          },
        }
      );

      await User.deleteOne({
        _id: user._id,
      });

      return res.json({
        message:
          "Your HubEthio account has been permanently deleted.",
      });
    } catch (err) {
      console.error(
        "Delete owner account error:",
        err
      );

      return res.status(500).json({
        message:
          "Failed to delete your account. Please try again.",
      });
    }
  }
);

export default router;
