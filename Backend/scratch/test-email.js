import nodemailer from 'nodemailer';
import 'dotenv/config';

console.log('Using SMTP Config:');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);
console.log('To:', process.env.ADMIN_EMAIL);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const mailOptions = {
  from: `"Modern Hospital Test" <${process.env.SMTP_USER}>`,
  to: process.env.ADMIN_EMAIL,
  subject: `Test SMTP Configuration`,
  text: `SMTP works correctly!`,
};

console.log('Sending test email...');
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Error sending email:', error);
    process.exit(1);
  } else {
    console.log('✅ Email sent successfully:', info.messageId);
    process.exit(0);
  }
});
