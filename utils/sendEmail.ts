import nodemailer from 'nodemailer';

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'Outlook', // or 'gmail', 'yahoo', etc., depending on your email provider
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    };

    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Error sending email');
  }
};