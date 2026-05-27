import Listing from "../models/Listing.js";
import { sendTrialReminderEmails } from "../jobs/sendTrialReminderEmails.js";

export async function expireTrials() {
  try {
    const now = new Date();

    const result = await Listing.updateMany(
      {
        paymentStatus: "trial",
        trialEndsAt: { $lte: now },
      },
      {
        $set: {
          paymentStatus: "unpaid",
          isFeatured: false,
          isVerified: false,
        },
      }
    );

    console.log(`✅ Expired trials checked. Updated: ${result.modifiedCount}`);
    await sendTrialReminderEmails();
  } catch (err) {
    console.error("❌ Failed to expire trials:", err);
  }
}