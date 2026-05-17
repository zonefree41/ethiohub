import "dotenv/config";

import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";

import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import authRoutes from "./routes/auth.js";
import paymentRoutes from "./routes/payments.js";
import webhookRoutes from "./routes/stripeWebhook.js";
import uploadRoutes from "./routes/upload.js";
import reviewRoutes from "./routes/reviews.js";
import ownerAuthRoutes from "./routes/ownerAuth.js";
import ownerListingRoutes from "./routes/ownerListings.js";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import stripeCheckoutRoutes from "./routes/stripeCheckout.js";

const app = express();

app.use(helmet());

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    message: "Too many requests. Please try again later.",
  },
});

app.use(generalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: {
    message: "Too many login attempts. Please try again later.",
  },
});

/*
|--------------------------------------------------------------------------
| Stripe Webhook
|--------------------------------------------------------------------------
| MUST come BEFORE express.json()
*/
app.use(
  "/api/webhooks/stripe",
  express.raw({ type: "application/json" }),
  webhookRoutes
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/
const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://localhost",
  "capacitor://localhost",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

/*
|--------------------------------------------------------------------------
| JSON Parser
|--------------------------------------------------------------------------
*/
app.use(express.json({ limit: "5mb" }));

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/*
|--------------------------------------------------------------------------
| Routes
|--------------------------------------------------------------------------
*/
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/owner/auth", authLimiter, ownerAuthRoutes);
app.use("/api/owner/listings", ownerListingRoutes);
app.use("/api/stripe", stripeCheckoutRoutes);
/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/
const port = process.env.PORT || 5000;

try {
  await connectDB(process.env.MONGO_URI);

  app.listen(port, () => {
    console.log(`✅ API running on http://localhost:${port}`);
  });
} catch (err) {
  console.error("❌ Server failed to start:", err.message);
  process.exit(1);
}