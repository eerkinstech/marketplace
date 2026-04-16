import { env } from "../../config/env.js";

export async function sendEmail({ to, subject, html }) {
  if (!env.resendApiKey || !env.resendFromEmail) {
    return { delivered: false, mode: "simulated" };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      from: env.resendFromEmail,
      to: Array.isArray(to) ? to : [to],
      subject,
      html
    })
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`Email delivery failed: ${payload}`);
  }

  return { delivered: true, mode: "resend" };
}
