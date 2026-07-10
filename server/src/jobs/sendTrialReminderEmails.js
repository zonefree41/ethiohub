import Listing from "../models/Listing.js";
import { sendEmail } from "../utils/sendEmail.js";

const DAY_MS = 24 * 60 * 60 * 1000;

function getDaysRemaining(trialEndsAt, now = new Date()) {
  if (!trialEndsAt) return null;

  const endDate = new Date(trialEndsAt);
  const difference = endDate.getTime() - now.getTime();

  return Math.ceil(difference / DAY_MS);
}

function getReminderDetails(listing, daysRemaining) {
  if (
    daysRemaining <= 14 &&
    daysRemaining > 7 &&
    !listing.trial14DayReminderSentAt
  ) {
    return {
      days: 14,
      trackingField: "trial14DayReminderSentAt",
      subject: "Your HubEthio Premium Trial Ends in 14 Days",
      heading: "Your Premium Trial Ends in Two Weeks",
      message:
        "Your HubEthio Premium Trial is approaching its end. You still have time to review your listing performance and continue your Premium benefits.",
    };
  }

  if (
    daysRemaining <= 7 &&
    daysRemaining > 1 &&
    !listing.trial7DayReminderSentAt
  ) {
    return {
      days: 7,
      trackingField: "trial7DayReminderSentAt",
      subject: "Your HubEthio Premium Trial Ends in 7 Days",
      heading: "One Week Remaining in Your Premium Trial",
      message:
        "Your HubEthio Premium Trial ends soon. Upgrade your listing to keep your Featured placement, Verified badge, and premium visibility.",
    };
  }

  if (
    daysRemaining <= 1 &&
    daysRemaining > 0 &&
    !listing.trial1DayReminderSentAt
  ) {
    return {
      days: 1,
      trackingField: "trial1DayReminderSentAt",
      subject: "Your HubEthio Premium Trial Ends Tomorrow",
      heading: "Your Premium Trial Ends Tomorrow",
      message:
        "This is a final reminder that your HubEthio Premium Trial ends tomorrow. Your basic listing will remain visible, but Premium benefits will be removed unless you upgrade.",
    };
  }

  return null;
}

function buildReminderEmail(listing, reminder) {
  const ownerName = listing.submittedBy?.name || "there";

  const trialEndDate = new Date(listing.trialEndsAt).toLocaleDateString(
    "en-US",
    {
      month: "long",
      day: "numeric",
      year: "numeric",
    }
  );

  const views = listing.clicks?.views || 0;
  const calls = listing.clicks?.call || 0;
  const websiteClicks = listing.clicks?.website || 0;
  const whatsappClicks = listing.clicks?.whatsapp || 0;
  const directionsClicks = listing.clicks?.directions || 0;

  return `
    <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
      <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">

        <div style="background:#0f172a;padding:32px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:30px;">
            HubEthio
          </h1>

          <p style="color:#cbd5e1;margin:10px 0 0;">
            Ethiopian Community Business Platform
          </p>
        </div>

        <div style="padding:38px 32px;color:#111827;line-height:1.7;">
          <h2 style="margin-top:0;color:#111827;font-size:26px;">
            ⏳ ${reminder.heading}
          </h2>

          <p style="font-size:16px;">
            Hi <strong>${ownerName}</strong>,
          </p>

          <p style="font-size:16px;">
            ${reminder.message}
          </p>

          <p style="font-size:16px;">
            This reminder is for:
            <strong>${listing.title}</strong>
          </p>

          <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;margin:26px 0;">
            <p style="margin:0;font-size:17px;font-weight:bold;color:#c2410c;">
              Trial Ends: ${trialEndDate}
            </p>
          </div>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin:26px 0;">
            <h3 style="margin-top:0;color:#0f172a;">
              Your listing activity
            </h3>

            <ul style="padding-left:20px;margin-bottom:0;">
              <li>👀 Views: ${views}</li>
              <li>📞 Call clicks: ${calls}</li>
              <li>🌐 Website clicks: ${websiteClicks}</li>
              <li>💬 WhatsApp clicks: ${whatsappClicks}</li>
              <li>📍 Direction requests: ${directionsClicks}</li>
            </ul>
          </div>

          <p style="font-size:16px;">
            Upgrade to continue receiving:
          </p>

          <ul style="padding-left:20px;">
            <li>✅ Featured placement</li>
            <li>✅ Verified badge</li>
            <li>✅ Priority search visibility</li>
            <li>✅ Better customer exposure</li>
            <li>✅ Listing performance analytics</li>
          </ul>

          <div style="text-align:center;margin:36px 0;">
            <a
              href="https://www.hubethio.com/pricing?listingId=${listing._id}"
              style="
                background:#f59e0b;
                color:#ffffff;
                text-decoration:none;
                padding:16px 28px;
                border-radius:10px;
                display:inline-block;
                font-size:16px;
                font-weight:bold;
              "
            >
              Upgrade My Listing
            </a>
          </div>

          <div style="border-top:1px solid #e5e7eb;padding-top:22px;margin-top:30px;">
            <p style="margin:0;color:#6b7280;">
              Your basic business listing will remain visible even if you do not upgrade.
            </p>

            <p style="margin-top:22px;color:#9ca3af;font-size:14px;">
              — HubEthio Team<br />
              support@hubethio.com
            </p>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function sendTrialReminderEmails() {
  try {
    const now = new Date();

    const listings = await Listing.find({
      paymentStatus: "trial",
      trialEndsAt: {
        $gt: now,
      },
    });

    console.log(
      `🔎 Checking ${listings.length} active trial listings for reminders`
    );

    let sentCount = 0;

    for (const listing of listings) {
      const daysRemaining = getDaysRemaining(listing.trialEndsAt, now);

      if (daysRemaining === null || daysRemaining > 14) {
        continue;
      }

      const reminder = getReminderDetails(listing, daysRemaining);

      if (!reminder) {
        continue;
      }

      const ownerEmail = listing.submittedBy?.contact;

      if (!ownerEmail || !ownerEmail.includes("@")) {
        console.log(
          `⚠️ Reminder skipped for ${listing.title}: no valid owner email`
        );
        continue;
      }

      await sendEmail({
        to: ownerEmail,
        subject: reminder.subject,
        html: buildReminderEmail(listing, reminder),
      });

      listing[reminder.trackingField] = new Date();

      // Keep the original field for compatibility with older code.
      if (reminder.days === 1) {
        listing.trialReminderSentAt = new Date();
      }

      await listing.save();

      sentCount += 1;

      console.log(
        `📧 ${reminder.days}-day trial reminder sent to ${ownerEmail} for ${listing.title}`
      );
    }

    console.log(`✅ Trial reminders sent: ${sentCount}`);
  } catch (err) {
    console.error("❌ Trial reminder job failed:", err);
  }
}