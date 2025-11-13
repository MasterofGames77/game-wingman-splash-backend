"use strict";
/**
 * Email templates for Video Game Wingman notifications
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignupConfirmationEmail = getSignupConfirmationEmail;
exports.getApprovalNotificationEmail = getApprovalNotificationEmail;
/**
 * Gets the ordinal suffix for a position (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(position) {
    if (position === null)
        return 'unknown';
    const remainder10 = position % 10;
    const remainder100 = position % 100;
    if (remainder10 === 1 && remainder100 !== 11) {
        return `${position}st`;
    }
    else if (remainder10 === 2 && remainder100 !== 12) {
        return `${position}nd`;
    }
    else if (remainder10 === 3 && remainder100 !== 13) {
        return `${position}rd`;
    }
    else {
        return `${position}th`;
    }
}
/**
 * Generates the signup confirmation email HTML
 */
function getSignupConfirmationEmail(email, position, hasProAccess) {
    const ordinalPosition = getOrdinalSuffix(position);
    const proMessage = hasProAccess
        ? `<p style="color: #4CAF50; font-weight: bold; margin-top: 20px;">
         🎉 Special Bonus: You are the ${ordinalPosition} of the first 5,000 users to sign up! 
         You will receive <strong>1 year of Wingman Pro for free</strong> when you're approved!
       </p>`
        : '';
    const subject = `Welcome to Video Game Wingman - You're on the Waitlist!`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Video Game Wingman</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <h1 style="color: #2c3e50; margin-top: 0;">Welcome to Video Game Wingman! 🎮</h1>
        
        <p>Hi there,</p>
        
        <p>Thank you for signing up for early access to <strong>Video Game Wingman</strong>! We're excited to have you on board.</p>
        
        <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0; font-size: 18px;">
            <strong>Your Waitlist Position: ${ordinalPosition}</strong>
          </p>
        </div>
        
        <p>We'll notify you via email as soon as you're approved for early access. In the meantime, stay tuned for updates!</p>
        
        ${proMessage}
        
        <p style="margin-top: 30px;">
          Best regards,<br>
          <strong>The Video Game Wingman Team</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #777;">
          If you have any questions, please don't hesitate to reach out to us.
        </p>
      </div>
    </body>
    </html>
  `;
    const text = `
Welcome to Video Game Wingman! 🎮

Hi there,

Thank you for signing up for early access to Video Game Wingman! We're excited to have you on board.

Your Waitlist Position: ${ordinalPosition}

We'll notify you via email as soon as you're approved for early access. In the meantime, stay tuned for updates!

${hasProAccess ? `\n🎉 Special Bonus: You are the ${ordinalPosition} of the first 5,000 users to sign up! You will receive 1 year of Wingman Pro for free when you're approved!\n` : ''}

Best regards,
The Video Game Wingman Team
  `.trim();
    return { subject, html, text };
}
/**
 * Generates the approval notification email HTML
 */
function getApprovalNotificationEmail(email, userId, hasProAccess) {
    const queryParams = new URLSearchParams({
        earlyAccess: 'true',
        userId: userId,
        email: email
    }).toString();
    const accessLink = `https://assistant.videogamewingman.com?${queryParams}`;
    const proMessage = hasProAccess
        ? `<div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
         <p style="margin: 0;">
           <strong>🎁 Pro Access Bonus:</strong> As one of the first 5,000 users, you have <strong>1 year of Wingman Pro for free</strong>!
         </p>
       </div>`
        : '';
    const subject = `🎉 You're Approved! Welcome to Video Game Wingman`;
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>You're Approved for Video Game Wingman!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background-color: #f4f4f4; padding: 20px; border-radius: 10px;">
        <h1 style="color: #27ae60; margin-top: 0;">🎉 You're Approved!</h1>
        
        <p>Hi there,</p>
        
        <p>Great news! You've been approved for early access to <strong>Video Game Wingman</strong>!</p>
        
        <p>You can now start using Video Game Wingman to enhance your gaming experience. Click the button below to get started:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${accessLink}" 
             style="background-color: #27ae60; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
            Get Started with Video Game Wingman
          </a>
        </div>
        
        <p style="font-size: 14px; color: #777;">
          Or copy and paste this link into your browser:<br>
          <a href="${accessLink}" style="color: #3498db; word-break: break-all;">${accessLink}</a>
        </p>
        
        ${proMessage}
        
        <p style="margin-top: 30px;">
          We're excited to have you on board and can't wait to see how Video Game Wingman helps enhance your gaming experience!
        </p>
        
        <p>
          Best regards,<br>
          <strong>The Video Game Wingman Team</strong>
        </p>
        
        <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;">
        
        <p style="font-size: 12px; color: #777;">
          If you have any questions or need assistance, please don't hesitate to reach out to us.
        </p>
      </div>
    </body>
    </html>
  `;
    const text = `
🎉 You're Approved!

Hi there,

Great news! You've been approved for early access to Video Game Wingman!

You can now start using Video Game Wingman to enhance your gaming experience. Click the link below to get started:

${accessLink}

${hasProAccess ? '\n🎁 Pro Access Bonus: As one of the first 5,000 users, you have 1 year of Wingman Pro for free!\n' : ''}

We're excited to have you on board and can't wait to see how Video Game Wingman helps enhance your gaming experience!

Best regards,
The Video Game Wingman Team
  `.trim();
    return { subject, html, text };
}
