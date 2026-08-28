import express from "express";
import VehicleListing from "../models/VehicleListing.js";
import { requireAdmin } from "../middleware/auth.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

async function sendVehicleApprovalEmail(vehicle) {
  const sellerEmail = vehicle?.sellerEmail;

  if (!sellerEmail) {
    console.log(
      "⚠️ No seller email found for approved vehicle listing."
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
    subject: `Your ${vehicleName} Is Now Live on HubEthio`,
    html: `
      <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#0f172a;padding:35px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;">HubEthio</h1>
            <p style="color:#cbd5e1;margin-top:10px;">
              Cars Marketplace
            </p>
          </div>

          <div style="padding:40px 32px;color:#111827;line-height:1.7;">
            <h2 style="margin-top:0;">
              Your Vehicle Is Live! 🎉
            </h2>

            <p>
              Hi ${vehicle.sellerName || "Seller"},
            </p>

            <p>
              Great news! Your vehicle listing has been reviewed
              and approved by HubEthio.
            </p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:25px 0;">
              <h3 style="margin-top:0;">Vehicle Listing</h3>

              <p style="margin:6px 0;">
                <strong>Vehicle:</strong> ${vehicleName}
              </p>

              <p style="margin:6px 0;">
                <strong>Status:</strong> Live
              </p>

              <p style="margin:6px 0;">
                <strong>Marketplace:</strong> HubEthio Cars
              </p>
            </div>

            <p>
              Buyers can now discover your vehicle in the
              HubEthio Cars Marketplace and contact you using
              the information provided with your listing.
            </p>

            <p>
              Your listing will remain active according to the
              current HubEthio Cars Marketplace listing period.
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
                Thank you for using HubEthio Cars Marketplace.
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
    "✅ Vehicle approval email sent."
  );

  return true;
}

async function sendVehicleRejectionEmail(vehicle) {
  const sellerEmail = vehicle?.sellerEmail;

  if (!sellerEmail) {
    console.log(
      "⚠️ No seller email found for rejected vehicle listing."
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

  const rejectionReason =
    vehicle.rejectionReason ||
    "Your vehicle listing needs changes before it can be approved.";

  await sendEmail({
    to: sellerEmail,
    subject: `Action Needed — ${vehicleName} Needs Changes`,
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
              Your Vehicle Listing Needs Changes
            </h2>

            <p>
              Hi ${vehicle.sellerName || "Seller"},
            </p>

            <p>
              We reviewed your vehicle listing, but it cannot be approved yet.
              Please review the reason below and update your listing.
            </p>

            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;margin:25px 0;">
              <h3 style="margin-top:0;">
                Vehicle Listing
              </h3>

              <p style="margin:6px 0;">
                <strong>Vehicle:</strong> ${vehicleName}
              </p>

              <p style="margin:6px 0;">
                <strong>Status:</strong> Changes Required
              </p>
            </div>

            <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:14px;padding:20px;margin:25px 0;">
              <h3 style="margin-top:0;">
                Review Reason
              </h3>

              <p style="margin-bottom:0;">
                ${rejectionReason}
              </p>
            </div>

            <p>
              You can edit your vehicle listing from My Cars.
              After you submit your changes, the listing will return
              to HubEthio for another review.
            </p>

            <div style="text-align:center;margin:35px 0;">
              <a
                href="https://www.hubethio.com/owner/my-cars"
                style="background:#f59e0b;color:white;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;"
              >
                Edit My Vehicle
              </a>
            </div>

            <div style="border-top:1px solid #e5e7eb;margin-top:35px;padding-top:25px;">
              <p style="color:#6b7280;">
                Once your changes are submitted, our team will review
                your vehicle again.
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
    "✅ Vehicle rejection email sent."
  );

  return true;
}

const allowedStatuses = new Set([
  "pending_review",
  "approved",
  "rejected",
  "sold",
  "expired",
]);

// Admin: list vehicle marketplace submissions
router.get("/", requireAdmin, async (req, res) => {
  try {
    const status = String(
      req.query.status || "pending_review"
    ).trim();

    if (!allowedStatuses.has(status)) {
      return res.status(400).json({
        message: "Invalid vehicle listing status.",
      });
    }

    const vehicles = await VehicleListing.find({
      status,
      paymentStatus: "paid",
    })
      .sort({ createdAt: -1 })
      .limit(200);

    return res.json(vehicles);
  } catch (err) {
    console.error(
      "Load admin vehicle listings failed:",
      err.message
    );

    return res.status(500).json({
      message: "Failed to load vehicle listings.",
    });
  }
});

router.patch(
  "/:vehicleId/approve",
  requireAdmin,
  async (req, res) => {
    try {
      const { vehicleId } = req.params;

      const vehicle = await VehicleListing.findById(
        vehicleId
      );

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle listing not found.",
        });
      }

      if (vehicle.paymentStatus !== "paid") {
        return res.status(400).json({
          message:
            "Vehicle listing must be paid before approval.",
        });
      }

      if (vehicle.status !== "pending_review") {
        return res.status(400).json({
          message:
            "Only vehicles pending review can be approved.",
        });
      }

      vehicle.status = "approved";
      vehicle.approvedAt = new Date();
      vehicle.rejectedAt = null;
      vehicle.rejectionReason = "";

      // V1 listing remains public for 30 days.
      vehicle.expiresAt = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      );

      await vehicle.save();

try {
  await sendVehicleApprovalEmail(vehicle);
} catch (emailErr) {
  console.error(
    "⚠️ Vehicle approval email failed:",
    emailErr.message
  );
}

return res.json({
  message: "Vehicle listing approved successfully.",
  vehicle,
});
    } catch (err) {
      console.error(
        "Approve vehicle listing failed:",
        err.message
      );

      return res.status(500).json({
        message: "Failed to approve vehicle listing.",
      });
    }
  }
);

router.patch(
  "/:vehicleId/reject",
  requireAdmin,
  async (req, res) => {
    try {
      const { vehicleId } = req.params;
      const rejectionReason =
        typeof req.body?.rejectionReason === "string"
          ? req.body.rejectionReason.trim()
          : "";

      if (!rejectionReason) {
        return res.status(400).json({
          message: "Rejection reason is required.",
        });
      }

      const vehicle = await VehicleListing.findById(
        vehicleId
      );

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle listing not found.",
        });
      }

      if (vehicle.paymentStatus !== "paid") {
        return res.status(400).json({
          message:
            "Vehicle listing must be paid before review.",
        });
      }

      if (vehicle.status !== "pending_review") {
        return res.status(400).json({
          message:
            "Only vehicles pending review can be rejected.",
        });
      }

      vehicle.status = "rejected";
      vehicle.rejectedAt = new Date();
      vehicle.approvedAt = null;
      vehicle.expiresAt = null;
      vehicle.rejectionReason =
  rejectionReason.slice(0, 1000);

await vehicle.save();

try {
  await sendVehicleRejectionEmail(vehicle);
} catch (emailErr) {
  console.error(
    "⚠️ Vehicle rejection email failed:",
    emailErr.message
  );
}

return res.json({
  message: "Vehicle listing rejected.",
  vehicle,
});
    } catch (err) {
      console.error(
        "Reject vehicle listing failed:",
        err.message
      );

      return res.status(500).json({
        message: "Failed to reject vehicle listing.",
      });
    }
  }
);

router.patch(
  "/:vehicleId/sold",
  requireAdmin,
  async (req, res) => {
    try {
      const { vehicleId } = req.params;

      const vehicle =
        await VehicleListing.findById(vehicleId);

      if (!vehicle) {
        return res.status(404).json({
          message: "Vehicle listing not found.",
        });
      }

      if (vehicle.paymentStatus !== "paid") {
        return res.status(400).json({
          message:
            "Only paid vehicle listings can be marked sold.",
        });
      }

      if (vehicle.status !== "approved") {
        return res.status(400).json({
          message:
            "Only approved vehicle listings can be marked sold.",
        });
      }

      vehicle.status = "sold";
      vehicle.soldAt = new Date();

      await vehicle.save();

      return res.json({
        message:
          "Vehicle listing marked as sold.",
        vehicle,
      });
    } catch (err) {
      console.error(
        "Mark vehicle sold failed:",
        err.message
      );

      return res.status(500).json({
        message:
          "Failed to mark vehicle as sold.",
      });
    }
  }
);

export default router;