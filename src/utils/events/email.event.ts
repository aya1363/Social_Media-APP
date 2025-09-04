import { EventEmitter } from 'node:events'
import { sendEmail } from '../email/send.email'
import { emailVerification } from '../email/template/email.template'
export const emailEvent = new EventEmitter()




emailEvent.on('confirmEmail', async (data):Promise<void> => {
    await sendEmail({ to: data.to, subject: data.subject || `confirm-email`, html: await emailVerification({ otp:data.otp}) }).catch(error=> {
        console.log(`fail to send email to ${data.to}`);
        
    })
})
emailEvent.on('sendForgetPassword', async (data): Promise<void> => {
  try {
    await sendEmail({
      to: data.to,
      subject: data.subject ?? 'forgot password',
      html: await emailVerification({ otp: data.otp, title: data.title }),
    })
  } catch (error) {
    console.error(`Failed to send sendForgetPassword to ${data.to}`, error)
  }
})


