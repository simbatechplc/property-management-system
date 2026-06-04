import nodemailer from "nodemailer";
import axios from "axios";

export const sendEmail = async ({
  to,
  subject,
  html,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}) => {
  const BREVO_API_KEY = process.env.BREVO_API_KEY;
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const senderEmail = process.env.SMTP_USER || "noreply@kururent.et";
  const senderName = "Kuru Rent";

  // Option 1: Brevo HTTP API (works on Render, 300 emails/day free, any recipient)
  if (BREVO_API_KEY) {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    console.log(`[EMAIL] Sent via Brevo to ${to}`);
    return;
  }

  // Option 2: Resend HTTP API (works on Render, 100 emails/day free, requires domain for any recipient)
  if (RESEND_API_KEY) {
    await axios.post(
      "https://api.resend.com/emails",
      { from: from || `${senderName} <onboarding@resend.dev>`, to, subject, html },
      {
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );
    return;
  }

  // Fallback: nodemailer SMTP (works locally, blocked on some cloud hosts)
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: senderEmail, pass: process.env.SMTP_PASS },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  } as any);

  await transporter.sendMail({
    from: from || `"${senderName}" <${senderEmail}>`,
    to,
    subject,
    html,
  });
};
