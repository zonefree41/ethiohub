import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import TransportationDriver from "../models/TransportationDriver.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const cleanedEmail = String(email).trim().toLowerCase();

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

export default router;
