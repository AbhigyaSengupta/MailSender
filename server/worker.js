import { Worker } from "bullmq";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection
transporter.verify((error) => {
  if (error) {
    console.log("❌ SMTP Connection Error:", error);
  } else {
    console.log("✅ SendGrid is ready (Running on @gmail.com mode)");
  }
});

const worker = new Worker(
  "hr-emails",
  async (job) => {
    const { email, name } = job.data;
    const recipientName = name || "Hiring Manager";

    console.log(`🚀 Processing: ${email}`);

    await transporter.sendMail({
      from: `"Abhigyan Sengupta" <${process.env.EMAIL_FROM}>`,
      to: email,
      // Strategy: Matching Reply-To increases trust scores slightly
      replyTo: process.env.EMAIL_FROM,
      subject: `Inquiry: Full Stack Developer Role | Portfolio of Abhigyan Sengupta (Attn: ${recipientName})`,

      text: `
Dear ${recipientName},

I hope this email finds you well. I am writing to express my interest in the Full Stack Developer position at your company. 

As an MCA student and a developer with a solid foundation in the MERN stack (MongoDB, Express, React, and Node.js), I enjoy building interactive and user-friendly web experiences. I am confident that my enthusiasm and ability to learn quickly will make me a valuable addition to your team.

Thank you for your time and consideration.

Best regards,

Abhigyan Sengupta
Email: abhigyan.senguptaofficial@gmail.com
Phone: +91 7044398037
LinkedIn: https://www.linkedin.com/in/abhigyan-sengupta-7925ab1b7
      `,

      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
          <p>Dear <strong>${recipientName}</strong>,</p>
          <p>I hope this email finds you well. I am writing to express my interest in the <strong>Full Stack Developer</strong> position at your company.</p>
          <p>As an MCA student and a developer with a solid foundation in the <strong>MERN stack</strong>, I enjoy building interactive and user-friendly web experiences.</p>
          <p>I am confident that my enthusiasm and ability to learn quickly will make me a valuable addition to your team.</p>
          <p>Thank you for your time and consideration.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="margin-bottom: 5px;"><strong>Best regards,</strong></p>
          <p style="margin: 0;"><strong>Abhigyan Sengupta</strong></p>
          <p style="margin: 0;">Email: <a href="mailto:abhigyan.senguptaofficial@gmail.com">abhigyan.senguptaofficial@gmail.com</a></p>
          <p style="margin: 0;">Phone: +91 7044398037</p>
          <p style="margin: 0;"><a href="https://www.linkedin.com/in/abhigyan-sengupta-7925ab1b7" style="color: #0077b5; text-decoration: none;">LinkedIn Profile</a></p>
        </div>
      `,
      // Adding Unsubscribe headers is standard practice for legitimate senders
      headers: {
        "List-Unsubscribe": `<mailto:${process.env.EMAIL_FROM}?subject=unsubscribe>`,
        "X-Entity-Ref-ID": job.id, // Helps group the message correctly in some clients
      },
    });
  },
  {
    connection,
    // CRITICAL: Without a domain, you MUST send slowly.
    // Sending 1 email every 60 seconds mimics human behavior and prevents instant blocking.
    limiter: {
      max: 1,
      duration: 60000,
    },
  }
);

worker.on("completed", (job) => console.log(`✅ Success: ${job.data.email}`));
worker.on("failed", (job, err) =>
  console.error(`❌ Failed ${job.data.email}: ${err.message}`)
);
