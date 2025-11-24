"use strict";
/**
 * Test script for approval email functionality
 * Run with: npx ts-node test-approval-email.ts
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
async function testApprovalEmail() {
    console.log('🧪 Testing Approval Email Service...\n');
    // Check if API key is configured
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ ERROR: RESEND_API_KEY is not set in your .env file');
        process.exit(1);
    }
    console.log('✅ RESEND_API_KEY is configured');
    console.log(`📧 From Email: ${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev (default)'}\n`);
    // Get test email from command line argument or use a default
    const testEmail = process.argv[2] || process.env.TEST_EMAIL || 'test@example.com';
    const testUserId = process.argv[3] || 'user-1234567890-test';
    if (!testEmail || testEmail === 'test@example.com') {
        console.log('⚠️  Usage:');
        console.log('   npx ts-node test-approval-email.ts your-email@example.com [userId]\n');
        console.log('Or set TEST_EMAIL in your .env file\n');
    }
    console.log(`📬 Sending approval email to: ${testEmail}`);
    console.log(`🆔 Using test userId: ${testUserId}\n`);
    try {
        // Generate a test approval notification email
        const emailContent = (0, emailTemplates_1.getApprovalNotificationEmail)(testEmail, testUserId, true // Test with Pro access
        );
        console.log('📤 Sending approval email...\n');
        await (0, sendEmail_1.sendEmail)(testEmail, emailContent.subject, emailContent.html, emailContent.text);
        console.log('\n✅ Approval email sent successfully!');
        console.log(`📬 Check your inbox at: ${testEmail}`);
        console.log('   (Also check your spam folder if you don\'t see it)');
        console.log(`\n🔗 The email should contain a link to access Video Game Wingman\n`);
    }
    catch (error) {
        console.error('\n❌ Error sending approval email:', error);
        console.log('\n🔍 Troubleshooting:');
        console.log('1. Verify your RESEND_API_KEY is correct');
        console.log('2. Check that your Resend account is active');
        console.log('3. Make sure the email address is valid');
        console.log('4. Check server logs above for detailed error messages\n');
        if (error?.message) {
            console.log('Error details:', error.message);
        }
        process.exit(1);
    }
}
// Run the test
testApprovalEmail();
