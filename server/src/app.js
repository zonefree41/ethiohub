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

const app = express();

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
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
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