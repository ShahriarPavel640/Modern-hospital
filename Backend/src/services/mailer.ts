// 1. Node built-ins

// 2. Third-party packages
import { Resend } from 'resend';

// 3. Internal absolute/relative imports
import { env } from '../config/env.js';

const resend = new Resend(env.RESEND_API_KEY);

export interface AppointmentNotificationData {
  patientName: string;
  patientPhone: string;
  doctorName: string;
  appointmentDate: string;
}

export function sendAppointmentNotification(data: AppointmentNotificationData): void {
  const { patientName, patientPhone, doctorName, appointmentDate } = data;

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #0f172a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-top: 0;">
        New Appointment Booking Notification
      </h2>
      <p style="color: #475569; font-size: 16px;">
        A new appointment has been successfully booked on the portfolio website. Here are the details:
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
      </table>
      <div style="margin-top: 25px; padding-top: 15px; border-top: 1px solid #e2e8f0; color: #64748b; font-size: 12px; text-align: center;">
        This is an automated notification from the Modern Hospital Management System.
      </div>
    </div>
  `;

  // Fire-and-forget: do not block response
  resend.emails.send({
    from: 'Modern Hospital Notification <onboarding@resend.dev>',
    to: env.ADMIN_EMAIL,
    subject: `New Appointment Booked - ${patientName}`,
    html: htmlContent,
  }).then((response) => {
    if (response.error) {
      console.error('❌ Error sending appointment notification email:', response.error);
    } else {
      console.log('📧 Appointment notification email sent successfully:', response.data?.id);
    }
  }).catch((error) => {
    console.error('❌ Error sending appointment notification email:', error);
  });
}
