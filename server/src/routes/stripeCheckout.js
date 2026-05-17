import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "https://www.hubethio.com";

const PRICES = {
  monthly: process.env.STRIPE_FEATURED_MONTHLY_PRICE_ID,
  yearly: process.env.STRIPE_FEATURED_YEARLY_PRICE_ID,
};

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { listingId, plan } = req.body;

    if (!listingId) {
      return res.status(400).json({ message: "Listing ID is required" });
    }

    if (!plan || !PRICES[plan]) {
      return res.status(400).json({ message: "Invalid subscription plan" });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: PRICES[plan],
          quantity: 1,
        },
      ],
      metadata: {
        listingId,
        plan,
      },
      success_url: `${CLIENT_ORIGIN}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_ORIGIN}/payment-cancelled?listingId=${listingId}`,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe checkout failed:", err.message);
    res.status(500).json({ message: "Failed to create checkout session" });
  }
});

export default router;