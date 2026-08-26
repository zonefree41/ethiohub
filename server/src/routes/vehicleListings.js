import express from "express";
import mongoose from "mongoose";
import VehicleListing from "../models/VehicleListing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import User from "../models/User.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";

const router = express.Router();

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  process.env.CLIENT_URL ||
  "https://www.hubethio.com";

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

async function optionalOwner(req, res, next) {
  try {
    const authHeader =
      req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return next();
    }

    const token = authHeader.slice(7);

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (
      !decoded?.id ||
      decoded.role !== "owner"
    ) {
      return next();
    }

    const user = await User.findOne({
      _id: decoded.id,
      role: "owner",
      accountStatus: "active",
    }).select("_id role accountStatus");

    if (user) {
      req.owner = {
        id: String(user._id),
        role: "owner",
      };
    }

    return next();
  } catch (err) {
    // This endpoint also supports guest sellers.
    // An invalid/expired optional token is ignored.
    return next();
  }
}

router.post(
  "/",
  optionalOwner,
  async (req, res) => {
  try {
    const {
      sellerType = "private",
      sellerName,
      sellerEmail,
      sellerPhone,
      year,
      make,
      model,
      trim = "",
      price,
      mileage,
      vin = "",
      exteriorColor = "",
      interiorColor = "",
      transmission = "",
      drivetrain = "",
      fuelType = "",
      titleStatus = "",
      condition = "",
      description = "",
      city,
      state,
      photos = [],
    } = req.body || {};

    const cleanedSellerName = cleanText(sellerName);
    const cleanedSellerEmail = cleanText(sellerEmail).toLowerCase();
    const cleanedSellerPhone = cleanText(sellerPhone);
    const cleanedMake = cleanText(make);
    const cleanedModel = cleanText(model);
    const cleanedCity = cleanText(city);
    const cleanedState = cleanText(state);

    if (
      !cleanedSellerName ||
      !cleanedSellerEmail ||
      !cleanedSellerPhone ||
      !cleanedMake ||
      !cleanedModel ||
      !cleanedCity ||
      !cleanedState
    ) {
      return res.status(400).json({
        message: "Please complete all required vehicle listing fields.",
      });
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        cleanedSellerEmail
      )
    ) {
      return res.status(400).json({
        message: "Please enter a valid seller email address.",
      });
    }

    const numericYear = Number(year);
    const numericPrice = Number(price);
    const numericMileage = Number(mileage);

    if (
      !Number.isInteger(numericYear) ||
      numericYear < 1900 ||
      numericYear > 2100
    ) {
      return res.status(400).json({
        message: "Please enter a valid vehicle year.",
      });
    }

    if (
      !Number.isFinite(numericPrice) ||
      numericPrice <= 0
    ) {
      return res.status(400).json({
        message: "Please enter a valid vehicle price.",
      });
    }

    if (
      !Number.isFinite(numericMileage) ||
      numericMileage < 0
    ) {
      return res.status(400).json({
        message: "Please enter valid vehicle mileage.",
      });
    }

    const cleanedPhotos = Array.isArray(photos)
      ? photos
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean)
          .slice(0, 20)
      : [];

    const vehicle = await VehicleListing.create({
  sellerUserId: req.owner?.id || null,

  sellerType:
    sellerType === "dealer"
      ? "dealer"
      : "private",

  sellerName: cleanedSellerName,
      sellerType:
        sellerType === "dealer"
          ? "dealer"
          : "private",

      sellerName: cleanedSellerName,
      sellerEmail: cleanedSellerEmail,
      sellerPhone: cleanedSellerPhone,

      year: numericYear,
      make: cleanedMake,
      model: cleanedModel,
      trim: cleanText(trim),

      price: numericPrice,
      mileage: numericMileage,

      vin: cleanText(vin).toUpperCase(),
      exteriorColor: cleanText(exteriorColor),
      interiorColor: cleanText(interiorColor),

      transmission: cleanText(transmission),
      drivetrain: cleanText(drivetrain),
      fuelType: cleanText(fuelType),
      titleStatus: cleanText(titleStatus),
      condition: cleanText(condition),

      description: cleanText(description),

      city: cleanedCity,
      state: cleanedState,

      photos: cleanedPhotos,

      status: "payment_pending",
      paymentStatus: "unpaid",
      listingFee: 9.99,
    });

    return res.status(201).json({
      message:
        "Vehicle listing created. Payment is required before admin review.",
      vehicleId: vehicle._id,
      status: vehicle.status,
      paymentStatus: vehicle.paymentStatus,
      listingFee: vehicle.listingFee,
    });
  } catch (err) {
    console.error(
      "Create vehicle listing failed:",
      err.message
    );

    return res.status(500).json({
      message: "Failed to create vehicle listing.",
    });
  }
});

router.post(
  "/:vehicleId/create-checkout-session",
  async (req, res) => {
    try {
      const { vehicleId } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(vehicleId)
      ) {
        return res.status(400).json({
          message: "Invalid vehicle listing ID.",
        });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({
          message: "Stripe is not configured.",
        });
      }

      const vehicle =
        await VehicleListing.findById(vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle listing not found.",
        });
      }

      if (vehicle.paymentStatus === "paid") {
        return res.status(400).json({
          message:
            "This vehicle listing has already been paid.",
        });
      }

      if (vehicle.status !== "payment_pending") {
        return res.status(400).json({
          message:
            "This vehicle listing is not awaiting payment.",
        });
      }

      const stripe = new Stripe(
        process.env.STRIPE_SECRET_KEY
      );

      const session =
        await stripe.checkout.sessions.create({
          mode: "payment",

          line_items: [
            {
              price_data: {
                currency: "usd",
                unit_amount: 999,

                product_data: {
                  name: `HubEthio Car Listing — ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                  description:
                    "30-day vehicle marketplace listing, subject to HubEthio admin approval.",
                },
              },

              quantity: 1,
            },
          ],

          metadata: {
            type: "vehicle_listing",
            vehicleId: String(vehicle._id),
          },

          customer_email:
            vehicle.sellerEmail || undefined,

          success_url:
            `${CLIENT_ORIGIN}/cars/payment-success?vehicleId=${vehicle._id}&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${CLIENT_ORIGIN}/cars/payment-cancelled?vehicleId=${vehicle._id}`,
        });

      vehicle.stripeSessionId = session.id;
      await vehicle.save();

      return res.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (err) {
      console.error(
        "Create checkout session failed:",
        err.message
      );

      return res.status(500).json({
        message: "Failed to create checkout session.",
      });
    }
  }
);

router.get("/", async (req, res) => {
  try {
    const now = new Date();

    const vehicles = await VehicleListing.find({
      status: "approved",
      paymentStatus: "paid",
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: now } },
      ],
    })
      .sort({
        isFeatured: -1,
        createdAt: -1,
      })
      .limit(200);

    return res.json(vehicles);
  } catch (err) {
    console.error(
      "Load public vehicle listings failed:",
      err.message
    );

    return res.status(500).json({
      message: "Failed to load vehicle listings.",
    });
  }
});

router.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "cars-marketplace",
  });
});

router.get(
  "/mine",
  requireOwner,
  async (req, res) => {
    try {
      const vehicles =
        await VehicleListing.find({
          sellerUserId: req.owner.id,
        }).sort({ createdAt: -1 });

      return res.json(vehicles);
    } catch (err) {
      console.error(
        "Load seller vehicles failed:",
        err.message
      );

      return res.status(500).json({
        message:
          "Failed to load your vehicle listings.",
      });
    }
  }
);

router.patch(
  "/mine/:vehicleId/sold",
  requireOwner,
  async (req, res) => {
    try {
      const vehicle =
        await VehicleListing.findOne({
          _id: req.params.vehicleId,
          sellerUserId: req.owner.id,
        });

      if (!vehicle) {
        return res.status(404).json({
          message:
            "Vehicle listing not found or you do not own this vehicle.",
        });
      }

      if (vehicle.paymentStatus !== "paid") {
        return res.status(400).json({
          message:
            "Vehicle listing payment must be complete.",
        });
      }

      if (vehicle.status !== "approved") {
        return res.status(400).json({
          message:
            "Only approved vehicles can be marked as sold.",
        });
      }

      vehicle.status = "sold";
      vehicle.soldAt = new Date();

      await vehicle.save();

      return res.json({
        message:
          "Your vehicle has been marked as sold.",
        vehicle,
      });
    } catch (err) {
      console.error(
        "Seller mark vehicle sold failed:",
        err.message
      );

      return res.status(500).json({
        message:
          "Failed to mark vehicle as sold.",
      });
    }
  }
);

router.get("/:vehicleId", async (req, res) => {
  try {
    const { vehicleId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(vehicleId)
    ) {
      return res.status(400).json({
        message: "Invalid vehicle listing ID.",
      });
    }

    const vehicle = await VehicleListing.findOne({
      _id: vehicleId,
      status: "approved",
      paymentStatus: "paid",
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    });

    if (!vehicle) {
      return res.status(404).json({
        message: "Vehicle listing not found.",
      });
    }

    return res.json(vehicle);
  } catch (err) {
    console.error(
      "Load public vehicle listing failed:",
      err.message
    );

    return res.status(500).json({
      message: "Failed to load vehicle listing.",
    });
  }
});


export default router;