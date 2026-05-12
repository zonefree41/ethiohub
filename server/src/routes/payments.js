import express from "express";
import Stripe from "stripe";

const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { listingId } = req.body;

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({ message: "Missing STRIPE_SECRET_KEY" });
    }

    if (!process.env.STRIPE_FEATURED_PRICE_ID) {
      return res.status(500).json({ message: "Missing STRIPE_FEATURED_PRICE_ID" });
    }

    if (!process.env.CLIENT_URL) {
      return res.status(500).json({ message: "Missing CLIENT_URL" });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        {
          price: process.env.STRIPE_FEATURED_PRICE_ID,
          quantity: 1
        }
      ],
      success_url: `${process.env.CLIENT_URL}/success?listing=${listingId}`,
cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
      metadata: {
        listingId
      },
      subscription_data: {
        metadata: {
          listingId
        }
      }
    });

    res.json({ url: session.url });
  } catch (err) {
  console.error("❌ Stripe checkout error:", err.message);
  console.error(err);
  res.status(500).json({
    error: "Payment failed",
    details: err.message,
  });
}
});

export default router;