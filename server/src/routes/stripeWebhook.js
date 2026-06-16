import express from "express";
import Stripe from "stripe";
import Listing from "../models/Listing.js";
import { sendEmail } from "../utils/sendEmail.js";

const router = express.Router();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function findListingBySubscription(subscriptionId) {
  if (!subscriptionId) return null;

  return Listing.findOne({
    stripeSubscriptionId: subscriptionId,
  });
}

async function setListingPaymentStatus(subscriptionId, patch) {
  const listing = await findListingBySubscription(subscriptionId);

  if (!listing) {
    console.log("⚠️ No listing found for subscription:", subscriptionId);
    return;
  }

  await Listing.findByIdAndUpdate(listing._id, patch);

  console.log("✅ Listing payment updated:", listing._id, patch);
}

async function sendFeaturedSubscriptionEmail(listing) {
  const ownerEmail = listing?.submittedBy?.contact;

  if (!ownerEmail) {
    console.log("⚠️ No owner email found for listing:", listing?._id);
    return;
  }

  await sendEmail({
    to: ownerEmail,
    subject: "🎉 Your HubEthio Featured Subscription Is Active",
    html: `
      <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
        <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
          <div style="background:#0f172a;padding:35px 30px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:32px;">HubEthio</h1>
            <p style="color:#cbd5e1;margin-top:10px;">Featured Subscription Activated</p>
          </div>

          <div style="padding:40px 32px;color:#111827;line-height:1.7;">
            <h2 style="margin-top:0;">🎉 Welcome to Featured</h2>

            <p>Thank you for upgrading your business on HubEthio.</p>

            <p>
              Your listing <strong>${listing.title}</strong> is now receiving premium visibility.
            </p>

            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:25px 0;">
              <h3 style="margin-top:0;">🚀 Active Benefits</h3>

              <ul style="padding-left:20px;">
                <li>⭐ Featured Placement</li>
                <li>✅ Verified Badge</li>
                <li>📈 Higher Search Ranking</li>
                <li>👀 Increased Visibility</li>
                <li>📊 Business Analytics</li>
              </ul>
            </div>

            <div style="text-align:center;margin:35px 0;">
              <a
                href="https://www.hubethio.com/owner/dashboard"
                style="background:#f59e0b;color:white;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;"
              >
                Open Owner Dashboard
              </a>
            </div>

            <div style="border-top:1px solid #e5e7eb;margin-top:35px;padding-top:25px;">
              <p style="color:#6b7280;">Thank you for supporting HubEthio.</p>

              <p style="color:#6b7280;">
                We're excited to help your business reach more customers in the Ethiopian community.
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

  console.log("✅ Featured subscription email sent:", ownerEmail);
}

router.post("/", async (req, res) => {
  const sig = req.headers["stripe-signature"];

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("❌ Webhook signature failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    console.log("📩 Stripe webhook received:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const listingId = session.metadata?.listingId;

        if (!listingId) {
          console.log("⚠️ checkout.session.completed missing listingId metadata");
          break;
        }

        const listing = await Listing.findByIdAndUpdate(
          listingId,
          {
            isFeatured: true,
            isVerified: true,
            paymentStatus: "active",
            stripeSessionId: session.id,
            stripeCustomerId: session.customer || "",
            stripeSubscriptionId: session.subscription || "",
          },
          { new: true }
        );

        if (!listing) {
          console.log("⚠️ No listing found for checkout listingId:", listingId);
          break;
        }

        console.log("✅ Listing featured after checkout:", listingId);

        try {
          await sendFeaturedSubscriptionEmail(listing);
        } catch (emailErr) {
          console.error("⚠️ Featured email failed:", emailErr.message);
        }

        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        await setListingPaymentStatus(subscriptionId, {
          isFeatured: true,
          isVerified: true,
          paymentStatus: "active",
        });

        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;

        await setListingPaymentStatus(subscriptionId, {
          isFeatured: false,
          isVerified: false,
          paymentStatus: "failed",
        });

        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        const cancelAt = subscription.cancel_at
          ? new Date(subscription.cancel_at * 1000)
          : null;

        if (subscription.status === "active" || subscription.status === "trialing") {
          await setListingPaymentStatus(subscriptionId, {
            isFeatured: true,
            isVerified: true,
            paymentStatus: "active",
            subscriptionCancelAt: cancelAt,
          });
        }

        if (
          subscription.status === "past_due" ||
          subscription.status === "unpaid" ||
          subscription.status === "incomplete_expired"
        ) {
          await setListingPaymentStatus(subscriptionId, {
            isFeatured: false,
            isVerified: false,
            paymentStatus: "failed",
            subscriptionCancelAt: cancelAt,
          });
        }

        if (subscription.status === "canceled") {
          await setListingPaymentStatus(subscriptionId, {
            isFeatured: false,
            isVerified: false,
            paymentStatus: "canceled",
            subscriptionCancelAt: cancelAt,
          });
        }

        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const subscriptionId = subscription.id;

        await setListingPaymentStatus(subscriptionId, {
          isFeatured: false,
          isVerified: false,
          paymentStatus: "canceled",
          subscriptionCancelAt: null,
        });

        break;
      }

      default:
        console.log("ℹ️ Unhandled Stripe event:", event.type);
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handling failed:", err);
    return res.status(500).json({ message: "Webhook handling failed" });
  }
});

export default router;