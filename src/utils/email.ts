import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string; // email content
}

/**
 * Send an email using Nodemailer
 */
export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  try {
    // 1️⃣ Create a transporter
    const transporter = nodemailer.createTransport({
      service: "gmail", // or "hotmail", "yahoo", or custom SMTP
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email app password
      },
    });

    // 2️⃣ Define email options
    const mailOptions = {
      from: `"Whisper App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

    // 3️⃣ Send email
    await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
