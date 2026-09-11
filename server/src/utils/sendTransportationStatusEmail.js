import { sendEmail } from "./sendEmail.js";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function sendTransportationStatusEmail(request) {
  if (
    !request?.customerEmail ||
    !["In Progress", "Completed", "Cancelled"].includes(
      request.status
    )
  ) {
    return null;
  }

  let subject = "";
  let heading = "";
  let message = "";

  if (request.status === "In Progress") {
    subject = "🚚 Your HubEthio Transportation Is In Progress";
    heading = "Your Transportation Is In Progress";
    message =
      "Good news! Your transportation provider has started your request.";
  }

  if (request.status === "Completed") {
    subject = "✅ Your HubEthio Transportation Has Been Completed";
    heading = "Transportation Completed";
    message =
      "Your transportation request has been completed successfully. Thank you for choosing HubEthio.";
  }

  if (request.status === "Cancelled") {
    subject = "❌ Your HubEthio Transportation Has Been Cancelled";
    heading = "Transportation Cancelled";
    message =
      "Unfortunately, your transportation request has been cancelled. Please contact the transportation provider if you have any questions.";
  }

  return sendEmail({
    to: request.customerEmail,
    subject,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px">
        <h2 style="color:#f59e0b;">${heading}</h2>
        <p>Hello ${escapeHtml(request.customerName)},</p>
        <p>${message}</p>

        <table style="width:100%;border-collapse:collapse;margin:25px 0;">
          <tr>
            <td><strong>Status</strong></td>
            <td>${escapeHtml(request.status)}</td>
          </tr>
          <tr>
            <td><strong>Pickup</strong></td>
            <td>${escapeHtml(request.pickupAddress)}</td>
          </tr>
          <tr>
            <td><strong>Delivery</strong></td>
            <td>${escapeHtml(request.deliveryAddress)}</td>
          </tr>
        </table>

        <p>
          You can continue using your secure transportation tracking link to
          view the latest status.
        </p>

        ${
          request.quoteAccessToken
            ? `
          <div style="text-align:center;margin:35px 0;">
            <a
              href="${process.env.CLIENT_ORIGIN}/transportation-quote/${request.quoteAccessToken}"
              style="
                display:inline-block;
                background:#f59e0b;
                color:#ffffff;
                padding:15px 28px;
                border-radius:8px;
                text-decoration:none;
                font-weight:bold;
              "
            >
              View Transportation Status
            </a>
          </div>
        `
            : ""
        }
      </div>
    `,
  });
}
