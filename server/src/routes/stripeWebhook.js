import express from "express";
import Stripe from "stripe";
import Listing from "../models/Listing.js";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
          paymentStatus: "active",
          stripeSessionId: session.id,
          stripeCustomerId: session.customer || "",
          stripeSubscriptionId: session.subscription || ""
        });

        console.log("✅ Listing featured after payment:", listingId);
      }
    }

    res.json({ received: true });
  } catch (err) {
    console.error("❌ Webhook handling failed:", err.message);
    res.status(500).json({ message: "Webhook handling failed" });
  }
});

export default router;