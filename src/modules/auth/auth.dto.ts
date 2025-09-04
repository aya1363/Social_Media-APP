import * as validators from './auth.validation'
import {z} from 'zod'
export type ISignupBodyInputsDto = z.infer<typeof validators.signup.body>

export type ILoginBodyInputsDto = z.infer<typeof validators.login.body>

export type IConfirmEmailBodyInputsDto = z.infer<typeof validators.confirmEmail.body>
export type IGmail = z.infer<typeof validators.signupWithGmail.body>
export type ILoginGmail = z.infer<typeof validators.loginWithGmail.body>
export type sendForgotPassword = z.infer<typeof validators.sendForgotPassword.body>
export type IResetPasswordDto  = z.infer<typeof validators.resetPassword.body>
export type IVerifyForgotPasswordOtp = z.infer<typeof validators.verifyForgotPasswordOtp.body>




