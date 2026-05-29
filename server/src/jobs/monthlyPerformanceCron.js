import cron from "node-cron";
import { sendMonthlyPerformanceEmails } from "./sendMonthlyPerformanceEmails.js";

export function startMonthlyPerformanceCron() {
  // Runs on the 1st day of every month at 9:00 AM server time
  cron.schedule("0 9 1 * *", async () => {
    console.log("📊 Running monthly performance email job...");

    await sendMonthlyPerformanceEmails();

    console.log("✅ Monthly performance email job finished.");
  });

  console.log("✅ Monthly performance cron scheduled.");
}