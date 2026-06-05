import Listing from "../models/Listing.js";
import { sendEmail } from "./sendEmail.js";
import { sendTrialReminderEmails } from "../jobs/sendTrialReminderEmails.js";

export async function expireTrials() {
  try {
    const now = new Date();

    const expiredListings = await Listing.find({
      paymentStatus: "trial",
      trialEndsAt: { $lte: now },
    });

    let updatedCount = 0;
    let emailCount = 0;

    for (const listing of expiredListings) {
      listing.paymentStatus = "unpaid";
      listing.isFeatured = false;
      listing.isVerified = false;

      const ownerEmail = listing.submittedBy?.contact;

      if (
        !listing.trialExpiredEmailSentAt &&
        ownerEmail &&
        ownerEmail.includes("@")
      ) {
        await sendEmail({
          to: ownerEmail,
          subject: `Your HubEthio Featured Trial Has Ended`,
          html: `
            <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
              <div style="max-width:650px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">
                <div style="background:#0f172a;padding:35px 30px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:32px;">HubEthio</h1>
                  <p style="color:#cbd5e1;margin-top:10px;">Featured Trial Ended</p>
                </div>

                <div style="padding:40px 32px;color:#111827;line-height:1.7;">
                  <h2 style="margin-top:0;">⏰ Your Featured Trial Has Ended</h2>

                  <p>Hi ${listing.submittedBy?.name || "there"},</p>

                  <p>
                    Your free Featured trial for
                    <strong>${listing.title}</strong>
                    has ended.
                  </p>

                  <p>
                    Your listing is still visible on HubEthio as a free/basic listing,
                    but premium visibility is now paused.
                  </p>

                  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;margin:25px 0;">
                    <h3 style="margin-top:0;color:#9a3412;">Premium features paused</h3>

                    <ul style="padding-left:20px;margin-bottom:0;">
                      <li>⭐ Featured placement removed</li>
                      <li>✅ Verified badge removed</li>
                      <li>📈 Priority search visibility paused</li>
                      <li>👀 Premium exposure paused</li>
                    </ul>
                  </div>

                  <p>
                    Upgrade anytime to restore Featured visibility and continue reaching
                    more customers in the Ethiopian community.
                  </p>

                  <div style="text-align:center;margin:35px 0;">
                    <a
                      href="https://www.hubethio.com/pricing?listingId=${listing._id}"
                      style="background:#f59e0b;color:white;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;"
                    >
                      Upgrade to Featured
                    </a>
                  </div>

                  <p style="color:#9ca3af;font-size:14px;">
                    — HubEthio Team<br/>
                    support@hubethio.com
                  </p>
                </div>
              </div>
            </div>
          `,
        });

        listing.trialExpiredEmailSentAt = new Date();
        emailCount++;
      }

      await listing.save();
      updatedCount++;

      console.log("✅ Trial expired processed for:", listing._id);
    }

    console.log(
      `✅ Expired trials checked. Updated: ${updatedCount}. Emails sent: ${emailCount}`
    );

    await sendTrialReminderEmails();
  } catch (err) {
    console.error("❌ Failed to expire trials:", err);
  }
}
