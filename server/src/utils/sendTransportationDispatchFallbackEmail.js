import User from "../models/User.js";
import { sendEmail } from "./sendEmail.js";

export async function sendTransportationDispatchFallbackEmail(request) {
  if (
    !request ||
    !request._id ||
    !request.ownerId ||
    request.redispatchFallbackEmailSentAt
  ) {
    return false;
  }

  const owner = await User.findOne({
    _id: request.ownerId,
    role: "owner",
  })
    .select("name email")
    .lean();

  if (!owner?.email) {
    return false;
  }

  const emailResult = await sendEmail({
    to: owner.email,
    subject: "Driver Assignment Needed for Transportation Request",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:650px;margin:auto;padding:30px;color:#111827;">
        <h2 style="color:#f59e0b;">
          Driver Assignment Needed
        </h2>

        <p>
          HubEthio could not automatically assign another eligible
          driver to this transportation request.
        </p>

        <div style="background:#fff3cd;padding:16px;border-radius:8px;margin:20px 0;">
          <strong>Manual assignment needed</strong>
          <p style="margin-bottom:0;">
            All currently eligible available drivers have been exhausted
            or no eligible driver is available. Please open your
            Transportation Dashboard and review this request.
          </p>
        </div>

        <div style="text-align:center;margin:30px 0;">
          <a
            href="${process.env.CLIENT_ORIGIN}/owner/transportation"
            style="display:inline-block;background:#00843d;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;"
          >
            Open Transportation Dashboard
          </a>
        </div>

        <p style="color:#6b7280;">
          — HubEthio Team
        </p>
      </div>
    `,
  });

  if (!emailResult) {
    return false;
  }

  request.redispatchFallbackEmailSentAt = new Date();
  await request.save();

  return true;
}
