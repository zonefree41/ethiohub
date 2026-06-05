import Listing from "../models/Listing.js";
import { sendEmail } from "../utils/sendEmail.js";

export async function sendTrialReminderEmails() {
  try {
    const now = new Date();

    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const listings = await Listing.find({
      paymentStatus: "trial",
      trialReminderSentAt: null,
      trialEndsAt: {
        $gte: now,
        $lte: tomorrow,
      },
    });

    console.log(`Found ${listings.length} trial listings`);

    for (const listing of listings) {
      const ownerEmail = listing.submittedBy?.contact;

      if (!ownerEmail || !ownerEmail.includes("@")) {
        continue;
      }

      await sendEmail({
        to: ownerEmail,
        subject: `Your HubEthio trial ends soon`,
        html: `
          <div style="font-family: Arial, sans-serif; line-height:1.7; color:#111827;">
            <h2>⏳ Your Featured Trial Ends Soon</h2>

            <p>Hi ${listing.submittedBy?.name || "there"},</p>

            <p>
              Your free Featured trial for
              <strong>${listing.title}</strong>
              will expire soon.
            </p>

            <p>Upgrade now to continue receiving:</p>

            <ul>
              <li>✅ Featured placement</li>
              <li>✅ Verified badge</li>
              <li>✅ Priority search visibility</li>
              <li>✅ Better customer exposure</li>
            </ul>

            <p>
              <strong>
                Trial Ends:
                ${new Date(listing.trialEndsAt).toLocaleDateString()}
              </strong>
            </p>

            <p style="margin-top:30px;">
              <a
                href="https://www.hubethio.com/pricing?listingId=${listing._id}"
                style="
                  background:#f59e0b;
                  color:#fff;
                  text-decoration:none;
                  padding:14px 24px;
                  border-radius:8px;
                  display:inline-block;
                  font-weight:bold;
                "
              >
                Upgrade Your Listing
              </a>
            </p>

            <p style="margin-top:30px;color:#6b7280;">
              Thank you,<br/>
              HubEthio Team
            </p>
          </div>
        `,
      });

      listing.trialReminderSentAt = new Date();
      await listing.save();

      console.log("📧 Trial reminder sent:", ownerEmail);
    }
  } catch (err) {
    console.error("❌ Trial reminder job failed:", err.message);
  }
}