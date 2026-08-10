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
import claimRoutes from "./routes/claimRoutes.js";
import businessRequestRoutes from "./routes/businessRequestRoutes.js";
import { startMonthlyPerformanceCron } from "./jobs/monthlyPerformanceCron.js";
import transportationRequestsRoutes from "./routes/transportationRequests.js";
import { expireTrials } from "./utils/expireTrials.js";
import { sendTrialReminderEmails } from "./jobs/sendTrialReminderEmails.js";
import { startDailyJobs } from "./jobs/dailyJobs.js";
import sitemapRoutes from "./routes/sitemap.js";
import adminTransportationRoutes from "./routes/adminTransportationRequests.js";
import housingRequestRoutes from "./routes/housingRequests.js";
import travelRequestRoutes from "./routes/travelRequests.js";
import adminHousingRequestRoutes from "./routes/adminHousingRequests.js";
import adminTravelRequestsRoutes from "./routes/adminTravelRequests.js";
import beautyAppointmentRoutes from "./routes/beautyAppointmentRequests.js";
import housingInquiryRoutes from "./routes/housingInquiries.js";
import immigrationConsultationRequestRoutes from "./routes/immigrationConsultationRequests.js";
import adminOwnerInvitationRoutes from "./routes/adminOwnerInvitations.js";
import insuranceConsultationRequestRoutes from "./routes/insuranceConsultationRequests.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: "cross-origin",
    },
  })
);

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
/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
*/

const allowedOrigins = [
  process.env.CLIENT_ORIGIN,
  process.env.CLIENT_URL,

  // Production website
  "https://hubethio.com",
  "https://www.hubethio.com",

  // Local web development
  "http://localhost:5173",
  "http://127.0.0.1:5173",

  // Capacitor Android
  "http://localhost",
  "https://localhost",

  // Capacitor iOS
  "capacitor://localhost",
].filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow tools such as curl, Postman and server-to-server requests
      // that do not send an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(`❌ CORS blocked origin: ${origin}`);

      return callback(
        new Error(`CORS policy does not allow origin: ${origin}`)
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);

app.use((err, req, res, next) => {
  if (err?.message?.includes("CORS")) {
    return res.status(403).json({
      message: err.message,
    });
  }

  next(err);
});

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
app.use("/api/claims", claimRoutes);
app.use("/api/business-requests", businessRequestRoutes);
app.use("/api/admin/transportation-requests", adminTransportationRoutes);
app.use("/api/housing-requests", housingRequestRoutes);
app.use(
  "/api/beauty-appointment-requests",
  beautyAppointmentRoutes
);
app.use(
  "/api/admin/owner-invitations",
  adminOwnerInvitationRoutes
);

app.use(
  "/api/transportation-requests",
  transportationRequestsRoutes
);

app.use(
  "/api/admin/travel-requests",
  adminTravelRequestsRoutes
);

app.use(
  "/api/travel-requests",
  travelRequestRoutes
);

app.use(
  "/api/insurance-consultation-requests",
  insuranceConsultationRequestRoutes
);

app.use(
  "/api/admin/housing-requests",
  adminHousingRequestRoutes
);

app.use(
  "/api/housing-inquiries",
  housingInquiryRoutes
);

app.use(
  "/api/immigration-consultation-requests",
  immigrationConsultationRequestRoutes
);

app.use("/", sitemapRoutes);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/
const port = process.env.PORT || 5000;

try {
  await connectDB(process.env.MONGO_URI);

  await expireTrials();

  startMonthlyPerformanceCron();
  startDailyJobs();

  app.listen(port, () => {
    console.log(`✅ API running on http://localhost:${port}`);
  });
} catch (err) {
  console.error("❌ Server failed to start:", err.message);
  process.exit(1);
}