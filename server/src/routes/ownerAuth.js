import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { sendEmail } from "../utils/sendEmail.js";
import crypto from "crypto";

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

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "owner",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    try {
  await sendEmail({
    to: user.email,
    subject: "Welcome to HubEthio",
    html: `
  <div style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,Helvetica,sans-serif;color:#111827;">
    <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
      <div style="background:linear-gradient(135deg,#07111f,#92400e);border-radius:24px 24px 0 0;padding:34px 28px;text-align:center;color:#ffffff;">
        <div style="width:64px;height:64px;border-radius:50%;border:2px solid #f59e0b;margin:0 auto 14px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:20px;">
          HE
        </div>

        <h1 style="margin:0;font-size:32px;line-height:1.15;">
          Welcome to HubEthio 🇪🇹
        </h1>

        <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#f9fafb;">
          Connecting Ethiopian businesses and communities.
        </p>
      </div>

      <div style="background:#ffffff;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 24px 24px;padding:30px 28px;">
        <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
          Hello <strong>${user.name}</strong>,
        </p>

        <p style="margin:0 0 18px;font-size:16px;line-height:1.7;color:#374151;">
          Your business owner account has been successfully created. You can now manage your business listing and connect with the Ethiopian community across the DMV area and beyond.
        </p>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:18px;padding:18px;margin:22px 0;">
          <h2 style="margin:0 0 12px;font-size:20px;color:#92400e;">
            What you can do next
          </h2>

          <ul style="margin:0;padding-left:20px;color:#374151;font-size:15px;line-height:1.8;">
            <li>Submit a business listing</li>
            <li>Edit and update your business information</li>
            <li>Upload your logo and banner image</li>
            <li>Upgrade to Featured placement</li>
            <li>Manage your subscription anytime</li>
          </ul>
        </div>

        <div style="text-align:center;margin:28px 0;">
          <a href="https://www.hubethio.com/owner/dashboard"
            style="display:inline-block;background:#f59e0b;color:#111827;text-decoration:none;font-weight:900;padding:14px 22px;border-radius:14px;font-size:16px;">
            Go to Owner Dashboard
          </a>
        </div>

        <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#4b5563;">
          Thank you for supporting Ethiopian businesses and helping grow our community platform.
        </p>

        <p style="margin:0;font-size:15px;line-height:1.7;color:#4b5563;">
          — The HubEthio Team
        </p>

        <hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0;" />

        <p style="margin:0;text-align:center;font-size:13px;line-height:1.6;color:#6b7280;">
          HubEthio<br />
          <a href="https://www.hubethio.com" style="color:#2563eb;text-decoration:none;font-weight:700;">
            www.hubethio.com
          </a>
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
    res.status(500).json({ message: "Registration failed" });
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
        <h1>Reset your HubEthio password</h1>

        <p>Hello ${user.name},</p>

        <p>
          Click the link below to reset your password. This link expires in 30 minutes.
        </p>

        <p>
          <a href="${resetUrl}">
            Reset Password
          </a>
        </p>

        <p>
          If you did not request this, you can ignore this email.
        </p>
      `,
    });

    // Temporary debug while email is not fully working
    console.log("Password reset URL:", resetUrl);

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

export default router;