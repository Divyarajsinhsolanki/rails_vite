import { Resend } from 'resend';
import twilio from 'twilio';

const resend = new Resend(process.env.RESEND_API_KEY || 'RESEND_API_KEY');
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID || 'ACxxxxxxxx', process.env.TWILIO_AUTH_TOKEN || 'your_auth_token');
const twilioFrom = process.env.TWILIO_FROM || '+1234567890';

export async function sendEmail(to) {
  return resend.emails.send({
    from: 'noreply@yourdomain.com',
    to,
    subject: 'Thanks for Presaving!',
    html: '<p>You\u2019ve successfully presaved the drop. Stay tuned!</p>'
  });
}

export async function sendSMS(to) {
  return twilioClient.messages.create({
    body: 'Hey! Your drop is ready.',
    from: twilioFrom,
    to
  });
}
