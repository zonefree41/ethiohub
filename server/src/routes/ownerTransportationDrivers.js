import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";

import TransportationDriver from "../models/TransportationDriver.js";
import Listing from "../models/Listing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

const allowedServiceTypes = [
  "Furniture Delivery",
  "Package Delivery",
  "Moving Service",
  "Airport Transportation",
  "Freight Delivery",
  "Other",
];

function cleanText(value) {
  return typeof value === "string" ? value.trim() : "";
}

router.use(requireOwner);

/*
OWNER

Create a driver for one owned Transportation listing
*/

router.post("/", async (req, res) => {
  try {
    const {
      businessListingId,
      fullName,
      email,
      phone,
      serviceTypes,
    } = req.body || {};

    const cleanedBusinessListingId = cleanText(businessListingId);
    const cleanedFullName = cleanText(fullName);
    const cleanedEmail = cleanText(email).toLowerCase();
    const cleanedPhone = cleanText(phone);

    if (
      !cleanedBusinessListingId ||
      !mongoose.Types.ObjectId.isValid(cleanedBusinessListingId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation listing ID is required.",
      });
    }

    if (!cleanedFullName) {
      return res.status(400).json({
        message: "Driver name is required.",
      });
    }

    if (cleanedFullName.length > 120) {
      return res.status(400).json({
        message: "Driver name is too long.",
      });
    }

    if (!cleanedPhone) {
      return res.status(400).json({
        message: "Driver phone number is required.",
      });
    }

    if (cleanedPhone.length > 40) {
      return res.status(400).json({
        message: "Driver phone number is too long.",
      });
    }

    if (cleanedEmail.length > 160) {
      return res.status(400).json({
        message: "Driver email is too long.",
      });
    }

    if (
      cleanedEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid driver email address.",
      });
    }

    if (
      serviceTypes !== undefined &&
      !Array.isArray(serviceTypes)
    ) {
      return res.status(400).json({
        message: "Driver service types must be an array.",
      });
    }

    const cleanedServiceTypes = Array.isArray(serviceTypes)
      ? [...new Set(serviceTypes.map(cleanText).filter(Boolean))]
      : [];

    if (
      cleanedServiceTypes.some(
        (serviceType) =>
          !allowedServiceTypes.includes(serviceType)
      )
    ) {
      return res.status(400).json({
        message: "Invalid driver service type.",
      });
    }

    const listing = await Listing.findOne({
      _id: cleanedBusinessListingId,
      ownerId: req.owner.id,
    }).populate("categoryId", "name_en slug");

    if (!listing) {
      return res.status(404).json({
        message:
          "Transportation listing not found or you do not own this listing.",
      });
    }

    if (listing.categoryId?.slug !== "transportation") {
      return res.status(400).json({
        message: "This listing is not a Transportation business.",
      });
    }

    if (cleanedEmail) {
      const existingDriver = await TransportationDriver.findOne({
        email: cleanedEmail,
      }).select("_id");

      if (existingDriver) {
        return res.status(409).json({
          message: "A Transportation driver with this email already exists.",
        });
      }
    }

    const driver = await TransportationDriver.create({
      ownerId: req.owner.id,
      businessListingId: listing._id,
      fullName: cleanedFullName,
      email: cleanedEmail,
      phone: cleanedPhone,
      serviceTypes: cleanedServiceTypes,
      status: "pending",
      verificationStatus: "not_submitted",
      availabilityStatus: "offline",
    });

    return res.status(201).json(driver);
  } catch (err) {
    console.error(
      "Create Transportation driver error:",
      err
    );

    return res.status(500).json({
      message: "Failed to create Transportation driver.",
    });
  }
});

/*
OWNER

Send an account activation invitation to one owned Transportation driver
*/

router.post("/:driverId/send-activation", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    }).select(
      "+activationTokenHash +activationExpires"
    );

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (!driver.email) {
      return res.status(400).json({
        message:
          "Driver email is required before sending an activation invitation.",
      });
    }

    if (driver.driverAccountStatus === "active") {
      return res.status(409).json({
        message: "This driver account is already active.",
      });
    }

    if (driver.driverAccountStatus === "disabled") {
      return res.status(403).json({
        message: "This driver account is disabled.",
      });
    }

    const rawActivationToken = crypto
      .randomBytes(32)
      .toString("hex");

    const activationTokenHash = crypto
      .createHash("sha256")
      .update(rawActivationToken)
      .digest("hex");

    const activationExpires = new Date(
      Date.now() + 24 * 60 * 60 * 1000
    );

    const activationUrl = `${
      process.env.CLIENT_URL ||
      "https://www.hubethio.com"
    }/driver/activate?token=${rawActivationToken}`;

    driver.activationTokenHash = activationTokenHash;
    driver.activationExpires = activationExpires;

    await driver.save();

    const emailResult = await sendEmail({
      to: driver.email,
      subject: "Activate your HubEthio Driver account",
      html: `
        <div style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827;">
          <div style="max-width:600px;margin:0 auto;padding:32px 16px;">
            <div style="background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 4px 18px rgba(0,0,0,0.06);">
              <div style="text-align:center;margin-bottom:28px;">
                <div style="font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                  HubEthio
                </div>
                <div style="margin-top:6px;font-size:14px;color:#6b7280;">
                  Driver Account Activation
                </div>
              </div>

              <h2 style="margin:0 0 20px;font-size:24px;line-height:1.3;text-align:center;">
                Activate Your HubEthio Driver Account
              </h2>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
                Hello,
              </p>

              <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">
                Your Transportation business has created a HubEthio Driver profile for you.
              </p>

              <p style="margin:0 0 24px;font-size:16px;line-height:1.7;">
                Activate your account to create your password and access your Driver workspace.
              </p>

              <div style="text-align:center;margin:30px 0;">
                <a
                  href="${activationUrl}"
                  style="display:inline-block;padding:14px 26px;border-radius:10px;background:#111827;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;"
                >
                  Activate Driver Account
                </a>
              </div>

              <div style="margin:24px 0;padding:14px 16px;background:#f9fafb;border-radius:10px;font-size:14px;line-height:1.6;color:#4b5563;">
                This activation link expires in 24 hours for your security.
              </div>

              <p style="margin:0;font-size:14px;line-height:1.6;color:#6b7280;">
                If you were not expecting this invitation, you can safely ignore this email.
              </p>
            </div>

            <p style="margin:18px 0 0;text-align:center;font-size:12px;color:#9ca3af;">
              © HubEthio
            </p>
          </div>
        </div>
      `,
    });

    if (!emailResult) {
      driver.activationTokenHash = "";
      driver.activationExpires = null;

      await driver.save();

      return res.status(502).json({
        message:
          "Driver activation email could not be sent. Please try again.",
      });
    }

    return res.json({
      message: "Driver activation invitation sent.",
    });
  } catch (err) {
    console.error(
      "Send Transportation driver activation error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to send Transportation driver activation invitation.",
    });
  }
});

/*
OWNER

Deactivate or reactivate one owned Transportation driver
*/

router.patch("/:driverId/status", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);
    const action = cleanText(req.body?.action).toLowerCase();

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    if (!["deactivate", "reactivate"].includes(action)) {
      return res.status(400).json({
        message:
          "Driver status action must be deactivate or reactivate.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    });

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (driver.status === "suspended") {
      return res.status(403).json({
        message:
          "A suspended driver status cannot be changed by the business owner.",
      });
    }

    if (action === "deactivate") {
      driver.status = "inactive";
      driver.availabilityStatus = "offline";

      await driver.save();

      return res.json(driver);
    }

    if (driver.verificationStatus !== "approved") {
      return res.status(400).json({
        message:
          "Driver verification must be approved before reactivation.",
      });
    }

    driver.status = "active";
    driver.availabilityStatus = "offline";

    await driver.save();

    return res.json(driver);
  } catch (err) {
    console.error(
      "Update Transportation driver status error:",
      err
    );

    return res.status(500).json({
      message: "Failed to update Transportation driver status.",
    });
  }
});

/*
OWNER

Update availability for one owned Transportation driver

*/
router.patch("/:driverId/availability", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);
    const availabilityStatus = cleanText(
      req.body?.availabilityStatus
    ).toLowerCase();

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    if (!["available", "offline"].includes(availabilityStatus)) {
      return res.status(400).json({
        message:
          "Driver availability must be available or offline.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    });

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (availabilityStatus === "offline") {
      driver.availabilityStatus = "offline";
      await driver.save();
      return res.json(driver);
    }

    if (driver.status !== "active") {
      return res.status(400).json({
        message:
          "Driver must be active before becoming available.",
      });
    }

    if (driver.verificationStatus !== "approved") {
      return res.status(400).json({
        message:
          "Driver verification must be approved before becoming available.",
      });
    }

    driver.availabilityStatus = "available";
    await driver.save();

    return res.json(driver);
  } catch (err) {
    console.error(
      "Update Transportation driver availability error:",
      err
    );

    return res.status(500).json({
      message:
        "Failed to update Transportation driver availability.",
    });
  }
});

/*
OWNER

Update basic information for one owned Transportation driver

*/

router.patch("/:driverId", async (req, res) => {
  try {
    const driverId = cleanText(req.params.driverId);

    if (
      !driverId ||
      !mongoose.Types.ObjectId.isValid(driverId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation driver ID is required.",
      });
    }

    const {
      fullName,
      email,
      phone,
      serviceTypes,
    } = req.body || {};

    const updates = {};

    if (fullName !== undefined) {
      const cleanedFullName = cleanText(fullName);

      if (!cleanedFullName) {
        return res.status(400).json({
          message: "Driver name is required.",
        });
      }

      if (cleanedFullName.length > 120) {
        return res.status(400).json({
          message: "Driver name is too long.",
        });
      }

      updates.fullName = cleanedFullName;
    }

    if (email !== undefined) {
      const cleanedEmail = cleanText(email).toLowerCase();

      if (cleanedEmail.length > 160) {
        return res.status(400).json({
          message: "Driver email is too long.",
        });
      }

      if (
        cleanedEmail &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanedEmail)
      ) {
        return res.status(400).json({
          message: "Please enter a valid driver email address.",
        });
      }

      updates.email = cleanedEmail;
    }

    if (phone !== undefined) {
      const cleanedPhone = cleanText(phone);

      if (!cleanedPhone) {
        return res.status(400).json({
          message: "Driver phone number is required.",
        });
      }

      if (cleanedPhone.length > 40) {
        return res.status(400).json({
          message: "Driver phone number is too long.",
        });
      }

      updates.phone = cleanedPhone;
    }

    if (serviceTypes !== undefined) {
      if (!Array.isArray(serviceTypes)) {
        return res.status(400).json({
          message: "Driver service types must be an array.",
        });
      }

      const cleanedServiceTypes = [
        ...new Set(serviceTypes.map(cleanText).filter(Boolean)),
      ];

      if (
        cleanedServiceTypes.some(
          (serviceType) =>
            !allowedServiceTypes.includes(serviceType)
        )
      ) {
        return res.status(400).json({
          message: "Invalid driver service type.",
        });
      }

      updates.serviceTypes = cleanedServiceTypes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No driver fields to update.",
      });
    }

    const driver = await TransportationDriver.findOne({
      _id: driverId,
      ownerId: req.owner.id,
    });

    if (!driver) {
      return res.status(404).json({
        message:
          "Transportation driver not found or you do not own this driver.",
      });
    }

    if (updates.email) {
      const existingDriver = await TransportationDriver.findOne({
        email: updates.email,
        _id: { $ne: driver._id },
      }).select("_id");

      if (existingDriver) {
        return res.status(409).json({
          message: "A Transportation driver with this email already exists.",
        });
      }
    }

    Object.assign(driver, updates);

    await driver.save();

    return res.json(driver);
  } catch (err) {
    console.error(
      "Update Transportation driver error:",
      err
    );

    return res.status(500).json({
      message: "Failed to update Transportation driver.",
    });
  }
});

/*
OWNER

Get drivers for one owned Transportation listing
*/

router.get("/", async (req, res) => {
  try {
    const businessListingId = String(
      req.query.businessListingId || ""
    ).trim();

    if (
      !businessListingId ||
      !mongoose.Types.ObjectId.isValid(businessListingId)
    ) {
      return res.status(400).json({
        message: "Valid Transportation listing ID is required.",
      });
    }

    const listing = await Listing.findOne({
      _id: businessListingId,
      ownerId: req.owner.id,
    }).populate("categoryId", "name_en slug");

    if (!listing) {
      return res.status(404).json({
        message:
          "Transportation listing not found or you do not own this listing.",
      });
    }

    if (listing.categoryId?.slug !== "transportation") {
      return res.status(400).json({
        message: "This listing is not a Transportation business.",
      });
    }

    const drivers = await TransportationDriver.find({
      ownerId: req.owner.id,
      businessListingId: listing._id,
    }).sort({ createdAt: -1 });

    return res.json(drivers);
  } catch (err) {
    console.error(
      "Load Transportation drivers error:",
      err
    );

    return res.status(500).json({
      message: "Failed to load Transportation drivers.",
    });
  }
});

export default router;
