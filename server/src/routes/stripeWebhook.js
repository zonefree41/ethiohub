import express from "express";
import Stripe from "stripe";
import Listing from "../models/Listing.js";

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
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const listingId = session.metadata?.listingId;

      if (listingId) {
        await Listing.findByIdAndUpdate(listingId, {
          isFeatured: true,
          isVerified: true,
          paymentStatus: "active",
          stripeSessionId: session.id,
          stripeCustomerId: session.customer || "",
          stripeSubscriptionId: session.subscription || "",
        });

        console.log("✅ Listing featured after checkout:", listingId);
      }
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      await setListingPaymentStatus(subscriptionId, {
        isFeatured: true,
        isVerified: true,
        paymentStatus: "active",
      });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subscriptionId = invoice.subscription;

      await setListingPaymentStatus(subscriptionId, {
        isFeatured: false,
        paymentStatus: "failed",
      });
    }

    if (event.type === "customer.subscription.updated") {
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
});
      }

      if (subscription.status === "canceled") {
        await setListingPaymentStatus(subscriptionId, {
  isFeatured: false,
  isVerified: false,
  paymentStatus: "canceled",
});
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const subscriptionId = subscription.id;

      await setListingPaymentStatus(subscriptionId, {
        isFeatured: false,
        paymentStatus: "canceled",
      });
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handling failed:", err.message);
    res.status(500).json({ message: "Webhook handling failed" });
  }
});

export default router;