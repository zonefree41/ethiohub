import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

import TransportationDriver from "../models/TransportationDriver.js";

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
