import cron from "node-cron";
import { expireTrials } from "../utils/expireTrials.js";
import { sendTrialReminderEmails } from "./sendTrialReminderEmails.js";

export function startDailyJobs() {
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running daily HubEthio jobs...");

    try {
      // Send reminder emails first
      await sendTrialReminderEmails();

      // Then expire any trials that have ended
      await expireTrials();

      console.log("✅ Daily HubEthio jobs finished.");
    } catch (err) {
      console.error("❌ Daily HubEthio jobs failed:", err);
    }
  });

  console.log("✅ Daily cron jobs scheduled.");
}