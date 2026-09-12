import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import TransportationDriver from "../models/TransportationDriver.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanedEmail = email.trim().toLowerCase();

    const driver = await TransportationDriver.findOne({
      email: cleanedEmail,
    }).select("+passwordHash");

    if (!driver || !driver.passwordHash) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const passwordOk = await bcrypt.compare(
      password,
      driver.passwordHash
    );

    if (!passwordOk) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    if (driver.driverAccountStatus !== "active") {
      return res.status(403).json({
        message: "Your driver account is not active.",
      });
    }

    const token = jwt.sign(
      {
        id: driver._id,
        role: "driver",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    return res.json({
      token,
      driver: {
        id: driver._id,
        fullName: driver.fullName,
        email: driver.email,
        ownerId: driver.ownerId,
        businessListingId: driver.businessListingId,
        status: driver.status,
        verificationStatus: driver.verificationStatus,
        availabilityStatus: driver.availabilityStatus,
        role: "driver",
      },
    });
  } catch (err) {
    console.error("Driver login error:", err);

    return res.status(500).json({
      message: "Driver login failed.",
    });
  }
});



router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body || {};

    if (typeof email !== "string" || !email.trim()) {
      return res.status(400).json({
        message: "Email is required.",
      });
    }

    const genericMessage =
      "If a driver account exists, a reset link has been sent.";

    const driver = await TransportationDriver.findOne({
      email: email.trim().toLowerCase(),
    });

    // Do not reveal whether a driver account exists or is eligible.
    if (!driver || driver.driverAccountStatus !== "active") {
      return res.json({
        message: genericMessage,
      });
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const passwordResetTokenHash = crypto
      .createHash("sha256")
      .update(rawToken)
      .digest("hex");

    driver.passwordResetTokenHash = passwordResetTokenHash;
    driver.passwordResetExpires = new Date(
      Date.now() + 1000 * 60 * 30
    );

    await driver.save();

    const clientUrl =
      process.env.CLIENT_URL || "https://www.hubethio.com";

    const resetUrl =
      `${clientUrl}/driver/reset-password/${rawToken}`;

    await sendEmail({
      to: driver.email,
      subject: "Reset your HubEthio Driver password",
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;color:#111827;line-height:1.6;">
          <h2>Reset Your HubEthio Driver Password</h2>
          <p>Hello ${driver.fullName},</p>
          <p>
            We received a request to reset the password for your
            HubEthio Driver account.
          </p>
          <p>
            <a href="${resetUrl}">
              Reset Driver Password
            </a>
          </p>
          <p>This password reset link expires in 30 minutes.</p>
          <p>
            If you did not request a password reset, you can safely
            ignore this email.
          </p>
          <p>— The HubEthio Team</p>
        </div>
      `,
    });

    return res.json({
      message: genericMessage,
    });
  } catch (err) {
    console.error("Driver forgot password error:", err);

    return res.status(500).json({
      message: "Failed to process driver password reset request.",
    });
  }
});


router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token.trim())
    ) {
      return res.status(400).json({
        message: "Valid password reset token is required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message: "Password must be at least 8 characters.",
      });
    }

    const passwordResetTokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    const driver = await TransportationDriver.findOne({
      passwordResetTokenHash,
      passwordResetExpires: { $gt: new Date() },
      driverAccountStatus: "active",
    }).select(
      "+passwordHash +passwordResetTokenHash +passwordResetExpires"
    );

    if (!driver) {
      return res.status(400).json({
        message: "Password reset link is invalid or expired.",
      });
    }

    driver.passwordHash = await bcrypt.hash(password, 10);
    driver.passwordResetTokenHash = "";
    driver.passwordResetExpires = null;

    await driver.save();

    return res.json({
      message:
        "Password reset successfully. You can now sign in.",
    });
  } catch (err) {
    console.error("Driver reset password error:", err);

    return res.status(500).json({
      message: "Failed to reset driver password.",
    });
  }
});

router.post("/activate", async (req, res) => {
  try {
    const { token, password } = req.body || {};

    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token.trim())
    ) {
      return res.status(400).json({
        message: "Valid driver activation token is required.",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters.",
      });
    }

    const activationTokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    const driver = await TransportationDriver.findOne({
      activationTokenHash,
      activationExpires: { $gt: new Date() },
      driverAccountStatus: "not_activated",
    }).select(
      "+passwordHash +activationTokenHash +activationExpires"
    );

    if (!driver) {
      return res.status(400).json({
        message:
          "Driver activation link is invalid or expired.",
      });
    }

    driver.passwordHash = await bcrypt.hash(password, 10);
    driver.driverAccountStatus = "active";
    driver.activationTokenHash = "";
    driver.activationExpires = null;

    await driver.save();

    return res.json({
      message: "Driver account activated successfully.",
    });
  } catch (err) {
    console.error("Driver activation error:", err);

    return res.status(500).json({
      message: "Driver account activation failed.",
    });
  }
});

export default router;
