/**
 * Send OTP email via Resend.
 * Set in .env: RESEND_API_KEY (from https://resend.com), EMAIL_FROM (e.g. "SOZOLEN 3D <onboarding@resend.dev>").
 */

import { Resend } from "resend";

const EMAIL_FROM = process.env.EMAIL_FROM || "SOZOLEN 3D <onboarding@resend.dev>";

function getSubject(type: "signup" | "forgot_password"): string {
  return type === "signup"
    ? "Your SOZOLEN 3D verification code"
    : "Reset your SOZOLEN 3D password";
}

function getHtml(to: string, code: string, type: "signup" | "forgot_password"): string {
  const message =
    type === "signup"
      ? "Use this code to complete your registration:"
      : "Use this code to reset your password:";
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 16px;">${getSubject(type)}</h2>
  <p>${message}</p>
  <p style="font-size: 28px; font-weight: bold; letter-spacing: 8px; margin: 24px 0;">${code}</p>
  <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. If you didn't request this, you can ignore this email.</p>
  <p style="color: #666; font-size: 14px;">— SOZOLEN 3D</p>
</body>
</html>`;
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  type: "signup" | "forgot_password"
): Promise<{ ok: boolean; error?: string }> {
  const subject = getSubject(type);
  const html = getHtml(to, code, type);

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY is not set in .env" };
  }

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("[email] Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("[email] Resend exception:", e);
    return { ok: false, error: e?.message || "Failed to send email" };
  }
}

/** Send confirmation email after custom request form submit, with tracking ID. */
export async function sendCustomRequestConfirmationEmail(
  to: string,
  customerName: string,
  trackingId: string
): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY is not set in .env" };
  }

  const subject = `Custom request received – Track with ${trackingId}`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 16px;">Custom request received</h2>
  <p>Hi ${customerName},</p>
  <p>We have received your custom print request. Our team will review it and get back to you soon.</p>
  <p><strong>Your tracking ID:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 18px;">${trackingId}</code></p>
  <p>You can track the status of your request anytime by visiting our <strong>Track</strong> page and entering this tracking ID.</p>
  <p style="color: #666; font-size: 14px;">— SOZOLEN 3D</p>
</body>
</html>`;

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("[email] Custom request confirmation Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("[email] Custom request confirmation exception:", e);
    return { ok: false, error: e?.message || "Failed to send email" };
  }
}

/** Notify customer when admin updates their custom request status. */
export async function sendCustomRequestStatusEmail(
  to: string,
  requestId: number,
  status: string,
  customerName?: string
): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY is not set in .env" };
  }

  const greeting = customerName ? `Hi ${customerName},` : "Hi,";
  const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const subject = `Your custom request #${requestId} – status updated`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 16px;">Custom request status update</h2>
  <p>${greeting}</p>
  <p>The status of your custom request <strong>#${requestId}</strong> has been updated to: <strong>${statusLabel}</strong>.</p>
  <p>We will contact you if we need any further details.</p>
  <p style="color: #666; font-size: 14px;">— SOZOLEN 3D</p>
</body>
</html>`;

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      subject,
      html,
    });
    if (error) {
      console.error("[email] Custom request status Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("[email] Custom request status exception:", e);
    return { ok: false, error: e?.message || "Failed to send email" };
  }
}

/** Helper to send a generic email via Resend. */
async function sendEmail(args: {
  to: string | string[];
  subject: string;
  html: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return { ok: false, error: "RESEND_API_KEY is not set" };
  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: Array.isArray(args.to) ? args.to : [args.to],
      subject: args.subject,
      html: args.html,
    });
    if (error) { console.error("[email] Resend error:", error); return { ok: false, error: error.message }; }
    return { ok: true };
  } catch (e: any) {
    console.error("[email] sendEmail exception:", e);
    return { ok: false, error: e?.message || "Failed to send email" };
  }
}

const ADMIN_NOTIFICATION_EMAILS = ["arasu.g.personal@gmail.com", "leninsarathi12@gmail.com"];

/** Welcome email sent to a customer created by admin, with link to set password. */
export async function sendAdminCreatedCustomerEmail(args: {
  to: string;
  customerName: string;
  otp: string;
}): Promise<{ ok: boolean; error?: string }> {
  const appUrl = process.env.APP_URL ?? "http://localhost:5000";
  const resetUrl = `${appUrl}/reset-password?email=${encodeURIComponent(args.to)}`;
  return sendEmail({
    to: args.to,
    subject: "Welcome to SOZOLEN 3D – Set your password",
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:500px;margin:0 auto;padding:24px;">
  <h2>Welcome to SOZOLEN 3D, ${args.customerName}!</h2>
  <p>An account has been created for you. Use the code below to set your password:</p>
  <p style="font-size:28px;font-weight:bold;letter-spacing:8px;margin:24px 0;">${args.otp}</p>
  <p>Visit the page below and enter your email address along with this code to set your password:</p>
  <p><a href="${resetUrl}" style="display:inline-block;padding:10px 16px;background:#111827;color:#fff;border-radius:6px;text-decoration:none;">Set Password</a></p>
  <p style="color:#666;font-size:13px;">This code expires in 10 minutes. If you didn't expect this email, you can ignore it.</p>
  <p style="color:#666;font-size:13px;">— SOZOLEN 3D</p>
</body></html>`,
  });
}

/** Notify admin emails when a new online or offline order is placed. */
export async function sendAdminNewOrderEmail(args: {
  orderId: number;
  customerName: string;
  customerEmail: string;
  total: number;
  isOffline: boolean;
  items: { name: string; quantity: number }[];
}): Promise<{ ok: boolean; error?: string }> {
  const itemsList = args.items.map((i) => `<li>${i.quantity}× ${i.name}</li>`).join("");
  const type = args.isOffline ? "Offline (Admin)" : "Online";
  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAILS,
    subject: `New ${type} Order #${args.orderId} – ₹${args.total.toLocaleString("en-IN")}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2>New ${type} Order Received</h2>
  <p><strong>Order #${args.orderId}</strong></p>
  <p><strong>Customer:</strong> ${args.customerName} (${args.customerEmail})</p>
  <p><strong>Total:</strong> ₹${args.total.toLocaleString("en-IN")}</p>
  <p><strong>Items:</strong></p><ul>${itemsList}</ul>
  <p style="color:#666;font-size:13px;">— SOZOLEN 3D Admin</p>
</body></html>`,
  });
}

/** Notify admin emails when an order is cancelled. */
export async function sendAdminOrderCancelledEmail(args: {
  orderId: number;
  customerName: string;
  customerEmail: string;
}): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAILS,
    subject: `Order #${args.orderId} Cancelled`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2>Order #${args.orderId} has been cancelled</h2>
  <p><strong>Customer:</strong> ${args.customerName} (${args.customerEmail})</p>
  <p style="color:#666;font-size:13px;">— SOZOLEN 3D Admin</p>
</body></html>`,
  });
}

/** Notify admin emails when a new custom request form is submitted. */
export async function sendAdminCustomFormEmail(args: {
  requestId: number;
  customerName: string;
  customerEmail: string;
  description: string;
}): Promise<{ ok: boolean; error?: string }> {
  return sendEmail({
    to: ADMIN_NOTIFICATION_EMAILS,
    subject: `New Custom Request SOZOLEN3D-${args.requestId} from ${args.customerName}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2>New Custom Request Received</h2>
  <p><strong>Tracking ID:</strong> SOZOLEN3D-${args.requestId}</p>
  <p><strong>Customer:</strong> ${args.customerName} (${args.customerEmail})</p>
  <p><strong>Description:</strong></p>
  <p style="background:#f5f5f5;padding:12px;border-radius:6px;">${args.description}</p>
  <p style="color:#666;font-size:13px;">— SOZOLEN 3D Admin</p>
</body></html>`,
  });
}

/** Notify customer when their order status changes. */
export async function sendOrderStatusChangeEmail(args: {
  to: string;
  customerName: string;
  orderId: number;
  newStatus: string;
}): Promise<{ ok: boolean; error?: string }> {
  const statusLabel = args.newStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const statusMessages: Record<string, string> = {
    confirmed: "Your order has been confirmed and is being processed.",
    shipped: "Great news! Your order has been shipped and is on its way.",
    delivered: "Your order has been delivered. We hope you love it!",
    cancelled: "Your order has been cancelled. Please contact us if you have any questions.",
  };
  const message = statusMessages[args.newStatus] ?? `Your order status has been updated to: ${statusLabel}.`;
  return sendEmail({
    to: args.to,
    subject: `Order #${args.orderId} – Status: ${statusLabel}`,
    html: `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px;">
  <h2>Order Update</h2>
  <p>Hi ${args.customerName},</p>
  <p>${message}</p>
  <p><strong>Order #${args.orderId}</strong> is now: <strong>${statusLabel}</strong></p>
  <p style="color:#666;font-size:13px;">Thank you for shopping with SOZOLEN 3D.</p>
  <p style="color:#666;font-size:13px;">— SOZOLEN 3D</p>
</body></html>`,
  });
}

export async function sendCustomRequestQuoteEmail(args: {
  to: string;
  customerName: string;
  trackingId: string;
  quotedPrice: number;
  quoteNotes?: string;
  quoteEta?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return { ok: false, error: "RESEND_API_KEY is not set in .env" };
  }

  const subject = `Quote ready for ${args.trackingId}`;
  const trackUrl = `${process.env.APP_URL ?? "http://localhost:5000"}/track`;
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin-bottom: 16px;">Your custom quote is ready</h2>
  <p>Hi ${args.customerName},</p>
  <p>We reviewed your custom request <strong>${args.trackingId}</strong>.</p>
  <p><strong>Quoted price:</strong> INR ${args.quotedPrice.toLocaleString("en-IN")}</p>
  ${args.quoteEta ? `<p><strong>Estimated timeline:</strong> ${args.quoteEta}</p>` : ""}
  ${args.quoteNotes ? `<p><strong>Notes:</strong> ${args.quoteNotes}</p>` : ""}
  <p>Please review and accept/reject your quote from your account, or track your request using the link below:</p>
  <p>
    <a href="${trackUrl}" style="display: inline-block; padding: 10px 14px; background: #111827; color: #ffffff; border-radius: 6px; text-decoration: none;">
      Open tracking page
    </a>
  </p>
  <p style="color: #666; font-size: 14px;">— SOZOLEN 3D</p>
</body>
</html>`;

  try {
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [args.to],
      subject,
      html,
    });
    if (error) {
      console.error("[email] Custom request quote Resend error:", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    console.error("[email] Custom request quote exception:", e);
    return { ok: false, error: e?.message || "Failed to send email" };
  }
}
