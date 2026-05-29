import cron from "node-cron";
import { expireTrials } from "../utils/expireTrials.js";

export function startDailyJobs() {
  // Runs every day at 9:00 AM server time
  cron.schedule("0 9 * * *", async () => {
    console.log("⏰ Running daily HubEthio jobs...");

    await expireTrials();

    console.log("✅ Daily HubEthio jobs finished.");
  });

  console.log("✅ Daily cron jobs scheduled.");
}