"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const resend_1 = require("resend");
// Lazy initialization - Resend client will be created when needed
let resendClient = null;
/**
 * Wraps a promise with a timeout
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout in milliseconds (default: 25000 for 25 seconds)
 * @param errorMessage - Custom error message for timeout
 * @returns Promise that rejects if timeout is exceeded
 */
function withTimeout(promise, timeoutMs = 25000, errorMessage = 'Operation timed out') {
    return Promise.race([
        promise,
        new Promise((_, reject) => {
            setTimeout(() => {
                reject(new Error(`${errorMessage} (${timeoutMs}ms)`));
            }, timeoutMs);
        })
    ]);
}
/**
 * Gets or creates the Resend client instance
 */
function getResendClient() {
    if (!process.env.RESEND_API_KEY) {
        return null;
    }
    if (!resendClient) {
        resendClient = new resend_1.Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}
/**
 * Sends an email using Resend
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @param text - Plain text fallback (optional)
 * @returns Promise that resolves when email is sent
 */
const sendEmail = async (to, subject, html, text) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not configured. Skipping email send.');
            return;
        }
        const resend = getResendClient();
        if (!resend) {
            console.error('Resend client not initialized. Check your RESEND_API_KEY format.');
            return;
        }
        const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
        console.log(`Attempting to send email via Resend to ${to}...`);
        // Wrap Resend API call with timeout (25 seconds to stay under Heroku's 30s limit)
        const { data, error } = await withTimeout(resend.emails.send({
            from: fromEmail,
            to: [to],
            subject,
            html,
            text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
        }), 25000, 'Email sending timed out');
        if (error) {
            console.error(`Resend API error sending email to ${to}:`, {
                message: error.message,
                name: error.name,
                error
            });
            throw error;
        }
        console.log(`Email sent successfully to ${to} via Resend. Email ID: ${data?.id}`);
    }
    catch (error) {
        // Log error but don't throw - email failures shouldn't break the main flow
        console.error(`Error sending email to ${to}:`, error);
        // Don't throw error - allow the main operation to continue
    }
};
exports.sendEmail = sendEmail;
