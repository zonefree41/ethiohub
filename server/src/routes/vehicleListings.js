import express from "express";
import mongoose from "mongoose";
import VehicleListing from "../models/VehicleListing.js";
import { requireOwner } from "../middleware/ownerAuth.js";
import User from "../models/User.js";
import Stripe from "stripe";
import jwt from "jsonwebtoken";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

const CLIENT_ORIGIN =
  process.env.CLIENT_ORIGIN ||
  process.env.CLIENT_URL ||
  "https://www.hubethio.com";

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

async function sendVehicleChangesSubmittedEmail(vehicle) {
  const sellerEmail = vehicle?.sellerEmail;

  if (!sellerEmail) {
    console.log(
      "⚠️ No seller email found for updated vehicle listing."
    );
    return false;
  }

  const vehicleName = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
  ]
    .filter(Boolean)
    .join(" ");

  await sendEmail({
    to: sellerEmail,
    subject: `Changes Submitted — ${vehicleName} Is Under Review`,
    html: `
      <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#0f172a;padding:35px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;">
              HubEthio
            </h1>

            <p style="color:#cbd5e1;margin-top:10px;">
              Cars Marketplace
            </p>
          </div>

          <div style="padding:40px 32px;color:#111827;line-height:1.7;">
            <h2 style="margin-top:0;">
              Changes Successfully Submitted
            </h2>

            <p>
              Hi ${vehicle.sellerName || "Seller"},
            </p>

            <p>
              We received the changes to your vehicle listing.
              Your updated listing has been submitted to the
              HubEthio team for review.
            </p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:25px 0;">
              <h3 style="margin-top:0;">
                Vehicle Listing
              </h3>

              <p style="margin:6px 0;">
                <strong>Vehicle:</strong> ${vehicleName}
              </p>

              <p style="margin:6px 0;">
                <strong>Payment Status:</strong> Paid
              </p>

              <p style="margin:6px 0;">
                <strong>Listing Status:</strong> Pending HubEthio Review
              </p>
            </div>

            <p>
              You do not need to pay the listing fee again.
              We will notify you after the review is completed.
            </p>

            <div style="text-align:center;margin:35px 0;">
              <a
                href="https://www.hubethio.com/owner/my-cars"
                style="background:#f59e0b;color:white;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;"
              >
                View My Cars
              </a>
            </div>

            <div style="border-top:1px solid #e5e7eb;margin-top:35px;padding-top:25px;">
              <p style="color:#6b7280;">
                Thank you for keeping your vehicle information
                up to date.
              </p>

              <p style="color:#9ca3af;font-size:14px;">
                — HubEthio Team<br/>
                support@hubethio.com
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  });

  console.log(
    "✅ Vehicle changes submitted email sent."
  );

  return true;
}

async function sendVehicleSoldConfirmationEmail(vehicle) {
  const sellerEmail = vehicle?.sellerEmail;

  if (!sellerEmail) {
    console.log(
      "⚠️ No seller email found for sold vehicle listing."
    );
    return false;
  }

  const vehicleName = [
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
  ]
    .filter(Boolean)
    .join(" ");

  await sendEmail({
    to: sellerEmail,
    subject: `Sold — ${vehicleName} Has Been Marked as Sold`,
    html: `
      <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#0f172a;padding:35px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;">
              HubEthio
            </h1>

            <p style="color:#cbd5e1;margin-top:10px;">
              Cars Marketplace
            </p>
          </div>

          <div style="padding:40px 32px;color:#111827;line-height:1.7;">
            <h2 style="margin-top:0;">
              Your Vehicle Has Been Marked as Sold 🎉
            </h2>

            <p>
              Hi ${vehicle.sellerName || "Seller"},
            </p>

            <p>
              Your vehicle listing has successfully been marked
              as sold on HubEthio Cars Marketplace.
            </p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:25px 0;">
              <h3 style="margin-top:0;">
                Vehicle Listing
              </h3>

              <p style="margin:6px 0;">
                <strong>Vehicle:</strong> ${vehicleName}
              </p>

              <p style="margin:6px 0;">
                <strong>Listing Status:</strong> Sold
              </p>
            </div>

            <p>
              The vehicle is no longer displayed as an active
              vehicle for sale to buyers.
            </p>

            <p>
              Thank you for using HubEthio to list your vehicle.
              You can sell another vehicle anytime from the
              Cars Marketplace.
            </p>

            <div style="text-align:center;margin:35px 0;">
              <a
                href="https://www.hubethio.com/sell-car"
                style="background:#f59e0b;color:white;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;"
              >
                Sell Another Car
              </a>
            </div>

            <div style="border-top:1px solid #e5e7eb;margin-top:35px;padding-top:25px;">
              <p style="color:#6b7280;">
                We appreciate you being part of HubEthio Cars
                Marketplace.
              </p>

              <p style="color:#9ca3af;font-size:14px;">
                — HubEthio Team<br/>
                support@hubethio.com
              </p>
            </div>
          </div>
        </div>
      </div>
    `,
  });

  console.log(
    "✅ Vehicle sold confirmation email sent."
  );

  return true;
}

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

router.post(
  "/mine/:vehicleId/renew-checkout-session",
  requireOwner,
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
        await VehicleListing.findOne({
          _id: vehicleId,
          sellerUserId: req.owner.id,
        });

      if (!vehicle) {
        return res.status(404).json({
          message:
            "Vehicle listing not found or you do not own this vehicle.",
        });
      }

      if (vehicle.status !== "expired") {
        return res.status(400).json({
          message:
            "Only expired vehicle listings can be renewed.",
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
                  name: `HubEthio Car Listing Renewal — ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
                  description:
                    "Renew your HubEthio Cars Marketplace listing for another 30-day period, subject to admin approval.",
                },
              },

              quantity: 1,
            },
          ],

          metadata: {
            type: "vehicle_listing_renewal",
            vehicleId: String(vehicle._id),
            sellerUserId: String(
              vehicle.sellerUserId
            ),
          },

          customer_email:
            vehicle.sellerEmail || undefined,

          success_url:
            `${CLIENT_ORIGIN}/cars/payment-success?vehicleId=${vehicle._id}&renewal=1&session_id={CHECKOUT_SESSION_ID}`,

          cancel_url:
            `${CLIENT_ORIGIN}/owner/my-cars`,
        });

      return res.json({
        url: session.url,
        sessionId: session.id,
      });
    } catch (err) {
      console.error(
        "Create vehicle renewal checkout failed:",
        err.message
      );

      return res.status(500).json({
        message:
          "Failed to create vehicle renewal checkout session.",
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

try {
  await sendVehicleSoldConfirmationEmail(vehicle);
} catch (emailErr) {
  console.error(
    "⚠️ Vehicle sold confirmation email failed:",
    emailErr.message
  );
}

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

router.get(
  "/mine/:vehicleId",
  requireOwner,
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

      const vehicle =
        await VehicleListing.findOne({
          _id: vehicleId,
          sellerUserId: req.owner.id,
        });

      if (!vehicle) {
        return res.status(404).json({
          message:
            "Vehicle listing not found or you do not own this vehicle.",
        });
      }

      return res.json(vehicle);
    } catch (err) {
      console.error(
        "Load seller vehicle failed:",
        err.message
      );

      return res.status(500).json({
        message:
          "Failed to load vehicle listing.",
      });
    }
  }
);

router.patch(
  "/mine/:vehicleId",
  requireOwner,
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

      const vehicle =
        await VehicleListing.findOne({
          _id: vehicleId,
          sellerUserId: req.owner.id,
        });

      if (!vehicle) {
        return res.status(404).json({
          message:
            "Vehicle listing not found or you do not own this vehicle.",
        });
      }

      if (vehicle.status === "sold") {
        return res.status(400).json({
          message:
            "Sold vehicle listings cannot be edited.",
        });
      }

      if (vehicle.status === "expired") {
        return res.status(400).json({
          message:
            "Expired vehicle listings cannot be edited.",
        });
      }

      const allowedFields = [
        "sellerType",
        "sellerName",
        "sellerEmail",
        "sellerPhone",
        "year",
        "make",
        "model",
        "trim",
        "price",
        "mileage",
        "vin",
        "exteriorColor",
        "interiorColor",
        "transmission",
        "drivetrain",
        "fuelType",
        "titleStatus",
        "condition",
        "description",
        "city",
        "state",
        "photos",
      ];

      const updates = {};

      for (const field of allowedFields) {
        if (field in (req.body || {})) {
          updates[field] = req.body[field];
        }
      }

      // Normalize text fields.
      const textFields = [
        "sellerName",
        "sellerPhone",
        "make",
        "model",
        "trim",
        "vin",
        "exteriorColor",
        "interiorColor",
        "description",
        "city",
        "state",
      ];

      for (const field of textFields) {
        if (field in updates) {
          updates[field] = cleanText(
            updates[field]
          );
        }
      }

      if ("sellerEmail" in updates) {
        updates.sellerEmail = cleanText(
          updates.sellerEmail
        ).toLowerCase();
      }

      if ("vin" in updates) {
        updates.vin =
          updates.vin.toUpperCase();
      }

      if ("year" in updates) {
        updates.year = Number(updates.year);

        if (
          !Number.isInteger(updates.year) ||
          updates.year < 1900 ||
          updates.year > 2100
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid vehicle year.",
          });
        }
      }

      if ("price" in updates) {
        updates.price = Number(updates.price);

        if (
          !Number.isFinite(updates.price) ||
          updates.price <= 0
        ) {
          return res.status(400).json({
            message:
              "Please enter a valid vehicle price.",
          });
        }
      }

      if ("mileage" in updates) {
        updates.mileage = Number(
          updates.mileage
        );

        if (
          !Number.isFinite(updates.mileage) ||
          updates.mileage < 0
        ) {
          return res.status(400).json({
            message:
              "Please enter valid vehicle mileage.",
          });
        }
      }

      if ("photos" in updates) {
        updates.photos = Array.isArray(
          updates.photos
        )
          ? updates.photos
              .filter(
                (item) =>
                  typeof item === "string"
              )
              .map((item) => item.trim())
              .filter(Boolean)
              .slice(0, 20)
          : [];
      }

      /*
       * If an already-approved public listing is
       * edited, send it back to admin review.
       *
       * Payment remains PAID. The seller does NOT
       * pay the $9.99 listing fee again.
       */
      const wasApproved =
  vehicle.status === "approved";

const wasRejected =
  vehicle.status === "rejected";

Object.assign(vehicle, updates);

if (wasApproved) {
  vehicle.status = "pending_review";
  vehicle.approvedAt = null;
}

// Clear an old rejection after seller edits it.
if (wasRejected) {
  vehicle.status = "pending_review";
  vehicle.rejectedAt = null;
  vehicle.rejectionReason = "";
}

await vehicle.save();

if (wasApproved || wasRejected) {
  try {
    await sendVehicleChangesSubmittedEmail(vehicle);
  } catch (emailErr) {
    console.error(
      "⚠️ Vehicle changes submitted email failed:",
      emailErr.message
    );
  }
}

      return res.json({
        message: wasApproved
          ? "Vehicle updated and sent for admin review."
          : "Vehicle listing updated successfully.",
        vehicle,
      });
    } catch (err) {
      console.error(
        "Seller update vehicle failed:",
        err.message
      );

      return res.status(500).json({
        message:
          "Failed to update vehicle listing.",
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