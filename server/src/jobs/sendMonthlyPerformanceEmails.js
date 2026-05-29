import Listing from "../models/Listing.js";
import { sendEmail } from "../utils/sendEmail.js";

export async function sendMonthlyPerformanceEmails() {
  try {
    const listings = await Listing.find({
      status: "approved",
      "submittedBy.contact": { $regex: /@/ },
    }).populate("categoryId");

    for (const listing of listings) {
      const ownerEmail = listing.submittedBy?.contact;
      const ownerName = listing.submittedBy?.name || "there";

      if (!ownerEmail || !ownerEmail.includes("@")) continue;

      const views = listing.clicks?.views || 0;
      const calls = listing.clicks?.call || 0;
      const whatsapp = listing.clicks?.whatsapp || 0;
      const website = listing.clicks?.website || 0;
      const directions = listing.clicks?.directions || 0;

      const totalEngagement = calls + whatsapp + website + directions;

      await sendEmail({
        to: ownerEmail,
        subject: `📊 ${listing.title} Monthly HubEthio Performance Report`,
        html: `
          <div style="background:#f4f7fb;padding:40px 20px;font-family:Arial,sans-serif;">
            <div style="max-width:680px;margin:auto;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e5e7eb;">

              <div style="background:#0f172a;padding:35px 30px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:32px;">HubEthio</h1>
                <p style="color:#cbd5e1;margin-top:10px;">Monthly Business Performance Report</p>
              </div>

              <div style="padding:40px 32px;color:#111827;line-height:1.7;">
                <h2 style="margin-top:0;">📊 Your Monthly Performance Report</h2>

                <p>Hi ${ownerName},</p>

                <p>
                  Here is your latest HubEthio performance summary for
                  <strong>${listing.title}</strong>.
                </p>

                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:22px;margin:28px 0;">
                  <h3 style="margin-top:0;color:#0f172a;">Business Overview</h3>

                  <p><strong>Category:</strong> ${listing.categoryId?.name_en || "Business"}</p>
                  <p><strong>Location:</strong> ${listing.city || ""}, ${listing.state || ""}</p>
                  <p><strong>Plan:</strong> ${
                    listing.paymentStatus === "active"
                      ? "Featured Subscription Active"
                      : listing.paymentStatus === "trial"
                      ? "Free Featured Trial"
                      : "Free Basic Listing"
                  }</p>
                </div>

                <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:28px 0;">
                  <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:18px;">
                    <div style="font-size:28px;font-weight:bold;color:#9a3412;">${views}</div>
                    <div style="color:#7c2d12;">Listing Views</div>
                  </div>

                  <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;padding:18px;">
                    <div style="font-size:28px;font-weight:bold;color:#166534;">${totalEngagement}</div>
                    <div style="color:#14532d;">Total Engagement</div>
                  </div>

                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:14px;padding:18px;">
                    <div style="font-size:28px;font-weight:bold;color:#1d4ed8;">${calls}</div>
                    <div style="color:#1e3a8a;">Phone Calls</div>
                  </div>

                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:14px;padding:18px;">
                    <div style="font-size:28px;font-weight:bold;color:#15803d;">${whatsapp}</div>
                    <div style="color:#14532d;">WhatsApp Clicks</div>
                  </div>

                  <div style="background:#fdf2f8;border:1px solid #fbcfe8;border-radius:14px;padding:18px;">
                    <div style="font-size:28px;font-weight:bold;color:#be185d;">${website}</div>
                    <div style="color:#831843;">Website Visits</div>
                  </div>

                  <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:14px;padding:18px;">
                    <div style="font-size:28px;font-weight:bold;color:#6d28d9;">${directions}</div>
                    <div style="color:#4c1d95;">Directions Clicks</div>
                  </div>
                </div>

                ${
                  listing.paymentStatus === "active"
                    ? `
                      <div style="background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;padding:20px;margin:28px 0;">
                        <h3 style="margin-top:0;color:#166534;">⭐ Featured Subscription Active</h3>
                        <p style="margin-bottom:0;color:#14532d;">
                          Your business is receiving premium visibility on HubEthio.
                        </p>
                      </div>
                    `
                    : `
                      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:14px;padding:20px;margin:28px 0;">
                        <h3 style="margin-top:0;color:#9a3412;">Want more visibility?</h3>
                        <p style="color:#7c2d12;">
                          Upgrade to Featured to get premium placement, a Featured badge,
                          Verified badge, and higher visibility across HubEthio.
                        </p>

                        <a
                          href="https://www.hubethio.com/pricing?listingId=${listing._id}"
                          style="background:#f59e0b;color:white;text-decoration:none;padding:13px 22px;border-radius:9px;font-weight:bold;display:inline-block;margin-top:8px;"
                        >
                          Upgrade to Featured
                        </a>
                      </div>
                    `
                }

                <div style="text-align:center;margin:35px 0;">
                  <a
                    href="https://www.hubethio.com/owner/dashboard"
                    style="background:#0f172a;color:white;text-decoration:none;padding:15px 28px;border-radius:10px;font-weight:bold;display:inline-block;"
                  >
                    Open Owner Dashboard
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

      console.log("📊 Monthly report sent:", ownerEmail);
    }

    console.log(`✅ Monthly performance emails checked. Sent: ${listings.length}`);
  } catch (err) {
    console.error("❌ Monthly performance email job failed:", err.message);
  }
}