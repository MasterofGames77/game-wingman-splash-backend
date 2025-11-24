"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const resend_1 = require("resend");
// Lazy initialization - Resend client will be created when needed
let resendClient = null;
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
 * Sends an email using Resend (recommended) or falls back to nodemailer
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content of the email
 * @param text - Plain text fallback (optional)
 * @returns Promise that resolves when email is sent
 */
const sendEmail = async (to, subject, html, text) => {
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
            const { data, error } = await resend.emails.send({
                from: fromEmail,
                to: [to],
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML tags for text fallback
            });
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
            const nodemailer = await Promise.resolve().then(() => __importStar(require('nodemailer')));
            const transporter = nodemailer.default.createTransport({
                service: process.env.EMAIL_SERVICE || 'Outlook',
                auth: {
                    user: process.env.EMAIL_USER,
                    pass: process.env.EMAIL_PASS,
                },
            });
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to,
                subject,
                html,
                text: text || html.replace(/<[^>]*>/g, ''),
            });
            console.log(`Email sent successfully to ${to} via nodemailer (fallback)`);
            return;
        }
        // No email service configured
        console.warn('Email service not configured. Set RESEND_API_KEY (recommended) or EMAIL_USER/EMAIL_PASS. Skipping email send.');
    }
    catch (error) {
        // Log error but don't throw - email failures shouldn't break the main flow
        console.error(`Error sending email to ${to}:`, error);
        // Don't throw error - allow the main operation to continue
    }
};
exports.sendEmail = sendEmail;
