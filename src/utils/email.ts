import nodemailer from "nodemailer";

interface EmailOptions {
  to: string;
  subject: string;
  html: string; 
}

/**
 * Send an email using Nodemailer
 * 
 */
export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<void> => {
  try {
    
    const transporter = nodemailer.createTransport({
      service: "gmail" ,
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS,
      },
    });

  
    const mailOptions = {
      from: `"Social Media App" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    };

  
    await transporter.sendMail(mailOptions);

    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("❌ Error sending email:", error);
    throw error;
  }
};
