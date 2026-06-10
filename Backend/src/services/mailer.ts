// 1. Node built-ins

// 2. Third-party packages
import nodemailer from 'nodemailer';

// 3. Internal absolute/relative imports
import { env } from '../config/env.js';

const transporter = nodemailer.createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_PORT === 465,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASSWORD,
  },
});

export interface AppointmentNotificationData {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
  serialNumber: number;
}

export function sendAppointmentNotification(data: AppointmentNotificationData): void {
  const { patientName, patientPhone, doctorName, appointmentDate, serialNumber } = data;

  const mailOptions = {
    from: `"Modern Hospital Notification" <${env.SMTP_USER}>`,
    to: env.ADMIN_EMAIL,
    subject: `New Appointment Booked - Serial #${serialNumber} (${patientName})`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">
          New Appointment Booking Notification
        </h2>
        <p style="color: #475569; font-size: 16px;">
          A new appointment serial has been successfully booked on the portfolio website. Here are the details:
        </p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155; width: 150px;">Patient Name:</td>
            <td style="padding: 8px 0; color: #0f172a;">${patientName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155;">Patient Phone:</td>
            <td style="padding: 8px 0; color: #0f172a;">${patientPhone}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155;">Doctor Name:</td>
            <td style="padding: 8px 0; color: #0f172a;">${doctorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: bold; color: #334155;">Appointment Date:</td>
            <td style="padding: 8px 0; color: #0f172a;">${appointmentDate}</td>
          </tr>
          <tr style="background-color: #eff6ff;">
            <td style="padding: 10px 8px; font-weight: bold; color: #1e40af; border-radius: 4px 0 0 4px;">Serial Number:</td>
            <td style="padding: 10px 8px; font-weight: bold; color: #1e40af; font-size: 18px; border-radius: 0 4px 4px 0;">${serialNumber}</td>
          </tr>
        </table>
        <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center;">
          This is an automated notification from the Modern Hospital Management System.
        </div>
      </div>
    `,
  };

  // Fire-and-forget: do not block response
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error('❌ Error sending appointment notification email:', error);
    } else {
      console.log('📧 Appointment notification email sent successfully:', info.messageId);
    }
  });
}
