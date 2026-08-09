import "dotenv/config";
import { sendEmail } from "./src/utils/sendEmail.js";

async function main() {
  const result = await sendEmail({
    to: "belaylielena@yahoo.com",
    subject: "🎉 Your HubEthio Insurance Listing Is Now Live!",
    html: `
      <div style="
        margin:0;
        padding:32px 16px;
        background:#f5f7fb;
        font-family:Arial,Helvetica,sans-serif;
        color:#1f2937;
      ">
        <div style="
          max-width:620px;
          margin:0 auto;
          background:#ffffff;
          border-radius:18px;
          overflow:hidden;
          box-shadow:0 8px 30px rgba(0,0,0,0.08);
        ">
          <div style="
            padding:32px 28px;
            text-align:center;
            background:linear-gradient(135deg,#166534,#15803d);
            color:#ffffff;
          ">
            <div style="font-size:36px;margin-bottom:10px;">
              🎉
            </div>

            <h1 style="
              margin:0;
              font-size:26px;
              line-height:1.3;
            ">
              Your HubEthio Listing Is Live!
            </h1>

            <p style="
              margin:10px 0 0;
              font-size:15px;
              opacity:0.95;
            ">
              Welcome to the HubEthio business community
            </p>
          </div>

          <div style="padding:30px 28px;">
            <p style="font-size:17px;margin-top:0;">
              Hi Lielena,
            </p>

            <p style="font-size:15px;line-height:1.7;">
              Great news! Your business listing has been approved
              and is now live on HubEthio.
            </p>

            <div style="
              margin:24px 0;
              padding:20px;
              background:#f0fdf4;
              border:1px solid #bbf7d0;
              border-radius:12px;
            ">
              <div style="
                font-size:18px;
                font-weight:700;
                color:#166534;
                margin-bottom:8px;
              ">
                Lielena Ketema – Insurance &amp; Financial Services
              </div>

              <div style="
                font-size:14px;
                line-height:1.8;
                color:#4b5563;
              ">
                🛡️ Insurance Agent<br>
                📍 Bellevue, Washington<br>
                ⭐ Featured Listing<br>
                ✅ Verified Business
              </div>
            </div>

            <p style="font-size:15px;line-height:1.7;">
              Your listing can now help Ethiopian community members
              discover your insurance and financial services and
              connect with you directly.
            </p>

            <p style="font-size:15px;line-height:1.7;">
              Your listing has also been connected to your HubEthio
              Owner account, so you can sign in to manage your
              business information and keep your profile up to date.
            </p>

            <div style="
              text-align:center;
              margin:30px 0 18px;
            ">
              <a
                href="https://hubethio.com/listing/6a78d7186fd37ee8e898dc8b"
                style="
                  display:inline-block;
                  margin:6px;
                  padding:13px 22px;
                  background:#15803d;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:9px;
                  font-weight:700;
                  font-size:14px;
                "
              >
                View My Listing
              </a>

              <a
                href="https://hubethio.com/owner"
                style="
                  display:inline-block;
                  margin:6px;
                  padding:13px 22px;
                  background:#1f2937;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:9px;
                  font-weight:700;
                  font-size:14px;
                "
              >
                Owner Dashboard
              </a>
            </div>

            <div style="
              margin-top:26px;
              padding:16px;
              background:#f9fafb;
              border-radius:10px;
              font-size:14px;
              line-height:1.6;
              color:#4b5563;
            ">
              <strong>Need help?</strong><br>
              If you have questions about your listing or need
              assistance managing your HubEthio profile, simply
              reply to this email.
            </div>

            <p style="
              margin:28px 0 0;
              font-size:15px;
              line-height:1.7;
            ">
              We're happy to have your business on HubEthio and
              look forward to helping more community members
              discover your services.
            </p>

            <p style="
              margin-bottom:0;
              font-size:15px;
              line-height:1.7;
            ">
              Best,<br>
              <strong>The HubEthio Team</strong><br>
              Ethiopian Community Services
            </p>
          </div>

          <div style="
            padding:18px 28px;
            text-align:center;
            background:#f3f4f6;
            color:#6b7280;
            font-size:12px;
            line-height:1.6;
          ">
            HubEthio • Connecting the Ethiopian Community
            with Trusted Services
          </div>
        </div>
      </div>
    `,
  });

  console.log("Welcome email result:", result);
}

main().catch((err) => {
  console.error("Welcome email failed:", err);
  process.exit(1);
});