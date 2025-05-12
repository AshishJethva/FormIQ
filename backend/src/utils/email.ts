// src/utils/email.ts
import nodemailer from 'nodemailer';
import { IUser } from '../models/userModel';

interface EmailOptions {
  email: string;
  subject: string;
  message: string;
  html?: string;
}

// Create reusable transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
};

// Send email function
export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();

    // Define mail options
    const mailOptions = {
      from: `"FormIQ" <${process.env.EMAIL_FROM || 'noreply@formiq.com'}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully: ', options.email);
  } catch (error) {
    console.error('Email sending error: ', error);
    throw new Error('Error sending email');
  }
};

// Send OTP email
export const sendOTPEmail = async (user: IUser, otp: string): Promise<void> => {
  const subject = 'FormIQ Verification Code';

  // Plain text version
  const message = `
    Hello ${user.name},
    
    Your verification code is: ${otp}
    
    This code will expire in 10 minutes. If you didn't request this code, please ignore this email.
    
    Best regards,
    FormIQ Team
  `;

  // HTML version with better formatting
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h2 style="color: #4F46E5;">FormIQ</h2>
      </div>
      <p>Hello ${user.name},</p>
      <p>Please use the verification code below to complete your account setup:</p>
      <div style="text-align: center; margin: 30px 0;">
        <div style="font-size: 36px; letter-spacing: 5px; font-weight: bold; color: #4F46E5; background-color: #f8fafc; padding: 15px; border-radius: 5px; display: inline-block;">
          ${otp}
        </div>
      </div>
      <p>This code will expire in <strong>10 minutes</strong>.</p>
      <p>If you didn't request this code, please ignore this email.</p>
      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e1e1e1; color: #6b7280; font-size: 14px;">
        <p>Best regards,<br>FormIQ Team</p>
      </div>
    </div>
  `;

  await sendEmail({
    email: user.email,
    subject,
    message,
    html,
  });
};
