import { Resend } from 'resend';
import axios from 'axios';

const resend = new Resend('re_5Y7LvpKA_3juFFuRQ5nqAFPU2TnzBqCvs');

export async function sendEmail(to) {
  return resend.emails.send({
    from: 'onboarding@resend.dev',
    to,
    subject: 'Thanks for Presaving!',
    html: '<p>You\u2019ve successfully presaved the drop. Stay tuned!</p>'
  });
}

export async function sendSMS(to) {
  const response = await axios.post('/api/send_sms', { to });
  return response.data;
}
