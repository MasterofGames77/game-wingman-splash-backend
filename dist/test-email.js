"use strict";
/**
 * Test script for email sending functionality
 * Run with: npx ts-node test-email.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sendEmail_1 = require("./utils/sendEmail");
const emailTemplates_1 = require("./utils/emailTemplates");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
async function testEmail() {
    console.log('🧪 Testing Email Service...\n');
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ ERROR: RESEND_API_KEY is not set in your .env file');
        console.log('\n📝 Please add the following to your .env file:');
        console.log('RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx');
        console.log('RESEND_FROM_EMAIL=onboarding@resend.dev  # Optional for testing\n');
        process.exit(1);
    }
    // Validate API key format
    if (!process.env.RESEND_API_KEY.startsWith('re_')) {
        console.error('❌ ERROR: RESEND_API_KEY format is invalid');
        console.log('   Resend API keys should start with "re_"');
        console.log(`   Your key starts with: "${process.env.RESEND_API_KEY.substring(0, 3)}..."`);
        console.log('\n📝 Please check your API key at https://resend.com/api-keys\n');
        process.exit(1);
    }
    console.log('✅ RESEND_API_KEY is configured');
    console.log(`   Key format: ${process.env.RESEND_API_KEY.substring(0, 10)}... (valid)`);
    console.log(`📧 From Email: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default)'}\n`);
    // Warn if nodemailer credentials are also set (might cause confusion)
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
        console.log('⚠️  WARNING: EMAIL_USER and EMAIL_PASS are also set.');
        console.log('   Resend will be used (nodemailer will be ignored).\n');
    }
    // Get test email from command line argument or use a default
    const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
    if (!testEmail || testEmail === 'test@example.com') {
        console.log('⚠️  No test email provided. Usage:');
        console.log('   npx ts-node test-email.ts your-email@example.com\n');
        console.log('Or set TEST_EMAIL in your .env file\n');
    }
    console.log(`📬 Sending test email to: ${testEmail}\n`);
    try {
        // Generate a test signup confirmation email
        const emailContent = (0, emailTemplates_1.getSignupConfirmationEmail)(testEmail, 1, // Test position
        true // Test with Pro access
        );
        console.log('📤 Sending email...\n');
        await (0, sendEmail_1.sendEmail)(testEmail, emailContent.subject, emailContent.html, emailContent.text);
        console.log('\n✅ Email sent successfully!');
        console.log(`📬 Check your inbox at: ${testEmail}`);
        console.log('   (Also check your spam folder if you don\'t see it)\n');
    }
    catch (error) {
        console.error('\n❌ Error sending test email:', error);
        console.log('\n🔍 Troubleshooting:');
        console.log('1. Verify your RESEND_API_KEY is correct and starts with "re_"');
        console.log('2. Check that your Resend account is active at https://resend.com');
        console.log('3. Make sure the email address is valid');
        console.log('4. Check if there are network/firewall issues blocking HTTPS connections');
        console.log('5. Verify your API key has "Sending access" permissions\n');
        if (error?.message) {
            console.log('Error details:', error.message);
        }
        process.exit(1);
    }
}
// Run the test
testEmail();
