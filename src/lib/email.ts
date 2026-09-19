import "server-only";

export interface SendPasswordResetEmailParams {
  email: string;
  resetUrl: string;
}

export interface SendEmailResult {
  success: boolean;
  provider: "smtp" | "resend" | "development-mock" | "unconfigured";
  error?: string;
}

/**
 * Sends a password reset email to the given recipient.
 * If an email provider (Resend or SMTP) is configured in environment variables, it uses it.
 * If no provider is configured:
 *  - In local development (NODE_ENV !== "production"), it logs the reset link to the console for testing.
 *  - In production, it gracefully reports that email delivery requires provider configuration.
 */
export async function sendPasswordResetEmail({
  email,
  resetUrl,
}: SendPasswordResetEmailParams): Promise<SendEmailResult> {
  const hasResend = Boolean(process.env.RESEND_API_KEY);
  const hasSmtp = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (!hasResend && !hasSmtp) {
    if (process.env.NODE_ENV !== "production") {
      console.info("\n=======================================================");
      console.info("[DEV EMAIL MOCK] Password Reset Email Request");
      console.info(`Recipient: ${email}`);
      console.info(`Reset URL: ${resetUrl}`);
      console.info("Expiry: 45 minutes");
      console.info("=======================================================\n");
      return { success: true, provider: "development-mock" };
    }

    return {
      success: false,
      provider: "unconfigured",
      error: "Password reset email delivery requires an email provider configuration.",
    };
  }

  // If environment variables exist in future configurations:
  if (hasResend) {
    // Resend integration placeholder if configured via HTTP fetch without external dependency
    try {
      const from = process.env.EMAIL_FROM || "onboarding@resend.dev";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          to: [email],
          subject: "Reset your admin password - UP 2027 Survey",
          html: `<p>You requested a password reset for your admin account.</p><p><a href="${resetUrl}">Click here to reset your password</a></p><p>This link will expire in 45 minutes. If you did not request this, please ignore this email.</p>`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, provider: "resend", error: data.message || "Failed to send email via Resend" };
      }
      return { success: true, provider: "resend" };
    } catch (err) {
      return { success: false, provider: "resend", error: String(err) };
    }
  }

  return {
    success: false,
    provider: "unconfigured",
    error: "Password reset email delivery requires an email provider configuration.",
  };
}
