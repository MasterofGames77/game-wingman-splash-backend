import nodemailer from 'nodemailer';

/**
 * Sends an email using nodemailer
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
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn('Email credentials not configured. Skipping email send.');
      return;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'Outlook',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}`);
  } catch (error) {
    // Log error but don't throw - email failures shouldn't break the main flow
    console.error(`Error sending email to ${to}:`, error);
    // Don't throw error - allow the main operation to continue
  }
};