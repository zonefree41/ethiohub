import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("RESEND_API_KEY is missing. Email not sent.");
    return null;
  }

  if (!to || !subject || !html) {
    console.warn("Missing email fields. Email not sent.");
    return null;
  }

  try {
    const result = await resend.emails.send({
      from: "HubEthio <support@hubethio.com>",
      to,
      subject,
      html,
    });

    return result;
  } catch (err) {
    console.error("Email send failed:", err);
    return null;
  }
}