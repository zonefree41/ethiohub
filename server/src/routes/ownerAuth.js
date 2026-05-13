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

    await sendEmail({
  to: user.email,
  subject: "Welcome to HubEthio",
  html: `
    <h1>Welcome to HubEthio</h1>

    <p>Hello ${user.name},</p>

    <p>
      Your business owner account has been successfully created.
    </p>

    <p>
      You can now:
    </p>

    <ul>
      <li>Submit business listings</li>
      <li>Manage your listings</li>
      <li>Edit your business profile</li>
      <li>Upgrade to featured listings</li>
    </ul>

    <p>
      Thank you for supporting the Ethiopian community through HubEthio.
    </p>

    <p>
      Visit:
      <a href="https://www.hubethio.com">
        www.hubethio.com
      </a>
    </p>
  `,
});

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