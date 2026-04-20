import { env } from "../../config/env.js";
import nodemailer from "nodemailer";

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: env.smtpUser && env.smtpPass
      ? {
          user: env.smtpUser,
          pass: env.smtpPass
        }
      : undefined
  });

  return transporter;
}

export async function sendEmail({ to, subject, html }) {
  if (!env.smtpHost || !env.smtpFromEmail) {
    return { delivered: false, mode: "simulated" };
  }

  const recipients = Array.isArray(to) ? to : [to];
  await getTransporter().sendMail({
    from: env.smtpFromName
      ? `"${env.smtpFromName}" <${env.smtpFromEmail}>`
      : env.smtpFromEmail,
    to: recipients,
    subject,
    html
  });

  return { delivered: true, mode: "smtp" };
}
