import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing. Email not sent.");
    return null;
  }

  if (!to || !subject || !html) {
    console.error("❌ Missing email fields:", { to, subject, hasHtml: Boolean(html) });
    return null;
  }

  try {
    console.log("📧 Sending email to:", to);

    const { data, error } = await resend.emails.send({
      from: "HubEthio <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("❌ Resend email error:", error);
      return null;
    }

    console.log("✅ Email sent:", data);
    return data;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    return null;
  }
}