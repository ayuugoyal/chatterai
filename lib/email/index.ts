import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || "587"),
  secure: process.env.EMAIL_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Chatter AI"}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
    to: email,
    subject: "Verify your email address",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Chatter AI!</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            <p>Thank you for signing up! Please click the button below to verify your email address and activate your account.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                        font-weight: bold;">
                Verify Email Address
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
              ${verificationUrl}
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 24 hours. If you didn't create an account with Chatter AI, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Chatter AI. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to Chatter AI!

      Thank you for signing up! Please verify your email address by clicking the link below:

      ${verificationUrl}

      This link will expire in 24 hours. If you didn't create an account with Chatter AI, you can safely ignore this email.

      © ${new Date().getFullYear()} Chatter AI. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending verification email:", error);
    return { success: false, error: "Failed to send verification email" };
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Chatter AI"}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
    to: email,
    subject: "Reset your password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            <p>We received a request to reset your password. Click the button below to choose a new password.</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                        font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">Or copy and paste this link in your browser:</p>
            <p style="background: #fff; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
              ${resetUrl}
            </p>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Chatter AI. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Password Reset Request

      We received a request to reset your password. Click the link below to choose a new password:

      ${resetUrl}

      This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.

      © ${new Date().getFullYear()} Chatter AI. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    return { success: false, error: "Failed to send password reset email" };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || "Chatter AI"}" <${process.env.EMAIL_FROM_ADDRESS || process.env.EMAIL_USER}>`,
    to: email,
    subject: "Welcome to Chatter AI!",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Chatter AI</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Chatter AI!</h1>
          </div>

          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
            <p>Your email has been verified successfully. You're all set to start creating amazing AI chatbots!</p>

            <h3 style="color: #667eea;">What's Next?</h3>
            <ul style="line-height: 2;">
              <li>Create your first AI agent</li>
              <li>Customize your chatbot's appearance</li>
              <li>Add knowledge base URLs</li>
              <li>Embed the chatbot on your website</li>
            </ul>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard"
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        padding: 14px 28px;
                        text-decoration: none;
                        border-radius: 5px;
                        display: inline-block;
                        font-weight: bold;">
                Go to Dashboard
              </a>
            </div>

            <p style="color: #666; font-size: 14px; margin-top: 30px;">
              If you have any questions, feel free to reach out to our support team.
            </p>
          </div>

          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>&copy; ${new Date().getFullYear()} Chatter AI. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
    text: `
      Welcome to Chatter AI!

      Hi ${name}!

      Your email has been verified successfully. You're all set to start creating amazing AI chatbots!

      What's Next?
      - Create your first AI agent
      - Customize your chatbot's appearance
      - Add knowledge base URLs
      - Embed the chatbot on your website

      Visit your dashboard: ${process.env.NEXT_PUBLIC_BASE_URL}/dashboard

      If you have any questions, feel free to reach out to our support team.

      © ${new Date().getFullYear()} Chatter AI. All rights reserved.
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error("Error sending welcome email:", error);
    return { success: false, error: "Failed to send welcome email" };
  }
}
