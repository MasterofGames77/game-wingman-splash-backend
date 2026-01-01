import { Resend } from 'resend';

// Lazy initialization - Resend client will be created when needed
let resendClient: Resend | null = null;

/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 25000 for 25 seconds)
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that rejects if timeout is exceeded
 */
function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 25000,
  errorMessage: string = 'Operation timed out'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`${errorMessage} (${timeoutMs}ms)`));
      }, timeoutMs);
    })
  ]);
}

/**
 * Gets or creates the Resend client instance
 */
function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  
  return resendClient;
}

/**
 * Sends an email using Resend (recommended) or falls back to nodemailer
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @param text - Plain text fallback (optional)
 * @returns Promise that resolves when email is sent
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<void> => {
  try {
    // Use Resend if API key is configured (recommended)
    if (process.env.RESEND_API_KEY) {
      const resend = getResendClient();
      
      if (!resend) {
        console.error('Resend client not initialized. Check your RESEND_API_KEY format.');
        return;
      }

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
      
      console.log(`Attempting to send email via Resend to ${to}...`);
      // Wrap Resend API call with timeout (25 seconds to stay under Heroku's 30s limit)
      const { data, error } = await withTimeout(
        resend.emails.send({
          from: fromEmail,
          to: [to],
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
        }),
        25000,
        'Email sending timed out'
      );

      if (error) {
        console.error(`Resend API error sending email to ${to}:`, {
          message: error.message,
          name: error.name,
          error
        });
        throw error; // Throw to prevent fallback to nodemailer
      }

      console.log(`Email sent successfully to ${to} via Resend. Email ID: ${data?.id}`);
      return;
    }

    // Fallback to nodemailer ONLY if Resend is not configured (for backward compatibility)
    // If RESEND_API_KEY is set, we should NOT fall back to nodemailer
    if (!process.env.RESEND_API_KEY && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      console.log(`Resend not configured, falling back to nodemailer for ${to}...`);
      const nodemailer = await import('nodemailer');
      
      const transporter = nodemailer.default.createTransport({
        service: process.env.EMAIL_SERVICE || 'Outlook',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      // Wrap nodemailer call with timeout (25 seconds to stay under Heroku's 30s limit)
      await withTimeout(
        transporter.sendMail({
          from: process.env.EMAIL_USER,
          to,
          subject,
          html,
          text: text || html.replace(/<[^>]*>/g, ''),
        }),
        25000,
        'Email sending timed out'
      );

      console.log(`Email sent successfully to ${to} via nodemailer (fallback)`);
      return;
    }

    // No email service configured
    console.warn('Email service not configured. Set RESEND_API_KEY (recommended) or EMAIL_USER/EMAIL_PASS. Skipping email send.');
  } catch (error) {
    // Log error but don't throw - email failures shouldn't break the main flow
    console.error(`Error sending email to ${to}:`, error);
    // Don't throw error - allow the main operation to continue
  }
};