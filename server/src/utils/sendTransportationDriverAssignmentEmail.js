import { sendEmail } from "./sendEmail.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransportationDriverAssignmentEmail(
  request,
  driver
) {
  if (!request?._id || !driver?.email) {
    return null;
  }

  const requestedDate = request.requestedDate
    ? new Date(request.requestedDate).toLocaleDateString()
    : "Not specified";

  const requestedTime =
    request.requestedTime || "Not specified";

  return sendEmail({
    to: driver.email,
    subject: "🚚 New HubEthio Transportation Job Assigned",
    html: `
      <div style="
        background:#f3f4f6;
        padding:24px 12px;
        font-family:Arial,sans-serif;
        color:#111827;
      ">
        <div style="
          max-width:620px;
          margin:0 auto;
          background:#ffffff;
          border-radius:14px;
          overflow:hidden;
          box-shadow:0 4px 14px rgba(0,0,0,0.08);
        ">

          <div style="
            background:#111827;
            padding:26px 24px;
            text-align:center;
          ">
            <div style="
              color:#f59e0b;
              font-size:14px;
              font-weight:bold;
              letter-spacing:1px;
              text-transform:uppercase;
              margin-bottom:8px;
            ">
              HubEthio Transportation
            </div>

            <div style="
              color:#ffffff;
              font-size:26px;
              font-weight:bold;
            ">
              🚚 New Job Assigned
            </div>
          </div>

          <div style="padding:28px 24px;">
            <p style="
              margin:0 0 18px;
              font-size:17px;
            ">
              Hello <strong>${escapeHtml(
                driver.fullName || "Driver"
              )}</strong>,
            </p>

            <p style="
              margin:0 0 24px;
              color:#4b5563;
              font-size:16px;
              line-height:1.6;
            ">
              A new transportation job has been assigned to you.
              Review the job details below, then open your Driver
              Dashboard to <strong>Accept or Decline</strong> it.
            </p>

            <div style="
              border:1px solid #e5e7eb;
              border-radius:10px;
              overflow:hidden;
              margin-bottom:28px;
            ">
              <div style="
                background:#f9fafb;
                padding:14px 18px;
                font-weight:bold;
                font-size:17px;
              ">
                Job Details
              </div>

              <table
                role="presentation"
                style="
                  width:100%;
                  border-collapse:collapse;
                  font-size:15px;
                "
              >
                <tr>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                    width:35%;
                    color:#6b7280;
                  ">
                    Service
                  </td>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                    font-weight:bold;
                  ">
                    ${escapeHtml(
                      request.serviceType || "Not specified"
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                    color:#6b7280;
                  ">
                    Pickup
                  </td>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                  ">
                    ${escapeHtml(
                      request.pickupAddress || "Not specified"
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                    color:#6b7280;
                  ">
                    Delivery
                  </td>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                  ">
                    ${escapeHtml(
                      request.deliveryAddress || "Not specified"
                    )}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                    color:#6b7280;
                  ">
                    Requested Date
                  </td>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                  ">
                    ${escapeHtml(requestedDate)}
                  </td>
                </tr>

                <tr>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                    color:#6b7280;
                  ">
                    Requested Time
                  </td>
                  <td style="
                    padding:14px 18px;
                    border-top:1px solid #e5e7eb;
                  ">
                    ${escapeHtml(requestedTime)}
                  </td>
                </tr>
              </table>
            </div>

            <div style="
              text-align:center;
              margin:30px 0 20px;
            ">
              <a
                href="${process.env.CLIENT_ORIGIN}/driver/dashboard"
                style="
                  display:inline-block;
                  background:#f59e0b;
                  color:#ffffff;
                  padding:15px 28px;
                  border-radius:8px;
                  text-decoration:none;
                  font-size:16px;
                  font-weight:bold;
                "
              >
                Review Job — Accept or Decline
              </a>
            </div>

            <p style="
              text-align:center;
              color:#6b7280;
              font-size:13px;
              line-height:1.5;
              margin:18px 0 0;
            ">
              Please respond from your Driver Dashboard so HubEthio
              can keep the customer and transportation team updated.
            </p>
          </div>

          <div style="
            background:#f9fafb;
            border-top:1px solid #e5e7eb;
            padding:18px 24px;
            text-align:center;
            color:#6b7280;
            font-size:13px;
          ">
            HubEthio Transportation<br>
            Connecting communities. Moving together.
          </div>

        </div>
      </div>
    `,
  });
}
