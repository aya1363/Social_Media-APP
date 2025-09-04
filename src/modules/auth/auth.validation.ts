import { z } from 'zod'
import { generalFields } from '../../middleware/validation.middleware';


export const login = {
    body: z.strictObject({
        email:generalFields.email,
        password:generalFields.password
    })
}

export const signup = {
    body: login.body.extend({
        userName: generalFields.userName,
        gender: generalFields.gender,
        confirmPassword:generalFields.confirmPassword
    }).superRefine((data ,ctx) => {
        //console.log({ data, ctx });
        if (data.confirmPassword !== data.password) {
            ctx.addIssue({
                code: 'custom',
                path: ['confirmEmail'],
                message:'password mismatch confirmPassword'
            })
        }
        
    })
}


export const confirmEmail = {
    body: z.strictObject({
        email: generalFields.email,
        otp:generalFields.otp
    })
}

export const signupWithGmail = {
    body: z.strictObject({
        idToken:z.string()
    })
}
export const loginWithGmail = {
    body: z.strictObject({
        idToken:z.string()
    })
}
export const sendForgotPassword = {
    body: z.strictObject({
          email:generalFields.email
    })
}
export const resetPassword = {
    body: z.strictObject({
         email: generalFields.email,
  password: generalFields.password,
  otp: generalFields.otp
    })
}
export const verifyForgotPasswordOtp = {
    body: z.strictObject({
        email: generalFields.email,
        otp:generalFields.otp
    })
}
