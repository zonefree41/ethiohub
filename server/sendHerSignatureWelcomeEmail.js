import "dotenv/config";
import { sendEmail } from "./src/utils/sendEmail.js";

async function main() {
  const result = await sendEmail({
    to: "hersignaturecare@gmail.com",

    subject:
      "🌸 Welcome to HubEthio — Her Signature Is Ready!",

    html: `
      <div style="
        margin:0;
        padding:32px 16px;
        background:#fff8f8;
        font-family:Arial,Helvetica,sans-serif;
        color:#2f2933;
      ">
        <div style="
          max-width:640px;
          margin:0 auto;
          background:#ffffff;
          border-radius:22px;
          overflow:hidden;
          box-shadow:0 10px 34px rgba(95,50,70,0.12);
          border:1px solid #f5d9df;
        ">

          <div style="
            padding:38px 28px;
            text-align:center;
            background:linear-gradient(
              135deg,
              #9f5667,
              #d98b9a,
              #f2c7cc
            );
            color:#ffffff;
          ">
            <div style="
              font-size:42px;
              margin-bottom:10px;
            ">
              🌸
            </div>

            <h1 style="
              margin:0;
              font-size:30px;
              line-height:1.25;
            ">
              Welcome, Her Signature!
            </h1>

            <p style="
              margin:12px 0 0;
              font-size:16px;
              line-height:1.6;
              color:#fffaf9;
            ">
              Your business is officially connected
              to your HubEthio Owner account.
            </p>
          </div>

          <div style="padding:32px 30px;">
            <p style="
              margin-top:0;
              font-size:17px;
              line-height:1.7;
            ">
              Hi Netanet,
            </p>

            <p style="
              font-size:15px;
              line-height:1.75;
              color:#5f5661;
            ">
              Congratulations! Your HubEthio Owner
              account is now fully activated, and
              <strong>Her Signature</strong> has been
              successfully connected to your account.
            </p>

            <div style="
              margin:26px 0;
              padding:22px;
              border-radius:16px;
              background:#fff6f7;
              border:1px solid #f3cbd2;
            ">
              <div style="
                font-size:21px;
                font-weight:800;
                color:#8f485b;
                margin-bottom:12px;
              ">
                🌷 Her Signature
              </div>

              <div style="
                font-size:14px;
                line-height:1.9;
                color:#5f5661;
              ">
                💄 Beauty &amp; Wellness<br>
                ✨ Skincare<br>
                ⭐ Featured Business<br>
                ✅ Verified Business
              </div>
            </div>

            <p style="
              font-size:15px;
              line-height:1.75;
              color:#5f5661;
            ">
              From your HubEthio Owner Dashboard,
              you can now manage your business profile,
              update your services and contact
              information, maintain your photos and
              business details, and review customer
              appointment requests.
            </p>

            <div style="
              margin:26px 0;
              padding:20px;
              background:#fffaf4;
              border:1px solid #efd6ad;
              border-radius:15px;
            ">
              <strong style="
                color:#a66c25;
                font-size:16px;
              ">
                Your HubEthio tools
              </strong>

              <p style="
                margin:10px 0 0;
                font-size:14px;
                line-height:1.8;
                color:#5f5661;
              ">
                • Manage your Her Signature listing<br>
                • Keep your services and business details updated<br>
                • Receive customer appointment requests<br>
                • Showcase your beauty and skincare work<br>
                • Build greater visibility in the community
              </p>
            </div>

            <div style="
              text-align:center;
              margin:32px 0 20px;
            ">
              <a
                href="https://www.hubethio.com/listing/6a49343d684e151c854927ab"
                style="
                  display:inline-block;
                  margin:6px;
                  padding:14px 23px;
                  background:#a75268;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:10px;
                  font-weight:800;
                  font-size:14px;
                "
              >
                View Her Signature
              </a>

              <a
                href="https://www.hubethio.com/owner/dashboard"
                style="
                  display:inline-block;
                  margin:6px;
                  padding:14px 23px;
                  background:#b8893f;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:10px;
                  font-weight:800;
                  font-size:14px;
                "
              >
                Open Owner Dashboard
              </a>
            </div>

            <div style="
              margin-top:26px;
              padding:17px;
              background:#f9fafb;
              border-radius:12px;
              font-size:14px;
              line-height:1.7;
              color:#65606a;
            ">
              <strong>Need assistance?</strong><br>
              If you ever need help managing your
              HubEthio business profile, simply reply
              to this email and the HubEthio team will
              be happy to assist.
            </div>

            <p style="
              margin:28px 0 0;
              font-size:15px;
              line-height:1.75;
              color:#5f5661;
            ">
              We’re happy to have Her Signature as part
              of HubEthio and look forward to helping
              more customers discover your skincare
              and beauty services.
            </p>

            <p style="
              margin-bottom:0;
              font-size:15px;
              line-height:1.7;
            ">
              Warm regards,<br>
              <strong>The HubEthio Team</strong><br>
              Ethiopian Community Services
            </p>
          </div>

          <div style="
            text-align:center;
            padding:18px 26px;
            background:#fff1f3;
            border-top:1px solid #f3d3d9;
            color:#85636b;
            font-size:12px;
            line-height:1.6;
          ">
            HubEthio • Connecting Ethiopian Businesses
            With Their Community
          </div>

        </div>
      </div>
    `,
  });

  console.log(
    "Her Signature welcome email result:",
    result
  );
}

main().catch((err) => {
  console.error(
    "Her Signature welcome email failed:",
    err
  );

  process.exit(1);
});