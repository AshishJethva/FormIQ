// src/services/emailService.ts
import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface PasswordResetEmailData {
  to: string;
  name: string;
  resetUrl: string;
  expiresIn: string;
}

export const sendPasswordResetEmail = async (
  data: PasswordResetEmailData
): Promise<void> => {
  const { to, name, resetUrl, expiresIn } = data;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset Request</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .email-container {
          background-color: #ffffff;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 10px;
        }
        .title {
          color: #1f2937;
          font-size: 24px;
          margin-bottom: 20px;
          text-align: center;
        }
        .content {
          margin-bottom: 30px;
        }
        .reset-button {
          display: inline-block;
          background-color: #2563eb;
          color: white;
          padding: 14px 28px;
          text-decoration: none;
          border-radius: 8px;
          font-weight: 600;
          text-align: center;
          margin: 20px 0;
          transition: background-color 0.3s ease;
        }
        .reset-button:hover {
          background-color: #1d4ed8;
        }
        .button-container {
          text-align: center;
          margin: 30px 0;
        }
        .warning {
          background-color: #fef3c7;
          border: 1px solid #f59e0b;
          border-radius: 6px;
          padding: 15px;
          margin: 20px 0;
        }
        .warning-icon {
          color: #d97706;
          margin-right: 8px;
        }
        .footer {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 14px;
          color: #6b7280;
          text-align: center;
        }
        .alternative-link {
          word-break: break-all;
          color: #2563eb;
          font-size: 12px;
          margin-top: 15px;
          padding: 10px;
          background-color: #f8fafc;
          border-radius: 4px;
        }
        @media (max-width: 600px) {
          body {
            padding: 10px;
          }
          .email-container {
            padding: 20px;
          }
          .reset-button {
            display: block;
            width: 100%;
            box-sizing: border-box;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <div class="logo">FormIQ</div>
        </div>
        
        <h1 class="title">Password Reset Request</h1>
        
        <div class="content">
          <p>Hello <strong>${name}</strong>,</p>
          
          <p>We received a request to reset the password for your account associated with <strong>${to}</strong>.</p>
          
          <p>If you made this request, please click the button below to reset your password:</p>
          
          <div class="button-container">
            <a href="${resetUrl}" style="color: white !important; text-decoration: none;" class="reset-button">Reset My Password</a>
          </div>
          
          <div class="warning">
            <span class="warning-icon">⚠️</span>
            <strong>Important:</strong> This password reset link will expire in <strong>${expiresIn}</strong> for security reasons.
          </div>
          
          <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
          <div class="alternative-link">${resetUrl}</div>
          
          <p><strong>If you didn't request this password reset:</strong></p>
          <ul>
            <li>Your account is still secure</li>
            <li>You can safely ignore this email</li>
            <li>No changes will be made to your account</li>
            <li>Consider changing your password if you suspect unauthorized access</li>
          </ul>
        </div>
        
        <div class="footer">
          <p>This email was sent from FormIQ Password Reset Service.</p>
          <p>If you have any questions or concerns, please contact our support team.</p>
          <p><em>This is an automated email, please do not reply to this message.</em></p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
    Password Reset Request - FormIQ

    Hello ${name},

    We received a request to reset the password for your account associated with ${to}.

    If you made this request, please visit the following link to reset your password:
    ${resetUrl}

    IMPORTANT: This password reset link will expire in ${expiresIn} for security reasons.

    If you didn't request this password reset:
    - Your account is still secure
    - You can safely ignore this email
    - No changes will be made to your account
    - Consider changing your password if you suspect unauthorized access

    This email was sent from FormIQ Password Reset Service.
    If you have any questions or concerns, please contact our support team.

    This is an automated email, please do not reply to this message.
  `;

  const mailOptions = {
    from: {
      name: 'FormIQ',
      address: process.env.EMAIL_FROM!,
    },
    to,
    subject: 'Reset Your FormIQ Password',
    text: textContent,
    html: htmlContent,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw new Error('Failed to send password reset email');
  }
};

export default {
  sendPasswordResetEmail,
};
