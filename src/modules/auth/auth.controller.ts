import { Router } from 'express'
import * as validators from './auth.validation'
import { validation } from '../../middleware/validation.middleware'

const router: Router = Router()
import authService from './auth.service'


router.post('/signup',validation(validators.signup), authService.signup)
router.post('/login',validation(validators.login), authService.login)

router.post('/confirm-email',validation(validators.confirmEmail), authService.confirmEmail)
router.post('/signup-gmail', validation(validators.signupWithGmail), authService.signupWithGmail)
router.post('/signup-gmail', validation(validators.loginWithGmail), authService.loginWithGmail)

router.patch('/send-forgot-password',validation(validators.sendForgotPassword), authService.sendForgotPassword)
router.patch('/verify/send-forgot-password',validation(validators.verifyForgotPasswordOtp), authService.verifyForgotPasswordOtp)
router.patch('/reset-password',validation(validators.resetPassword), authService.resetPassword)



export default router;
