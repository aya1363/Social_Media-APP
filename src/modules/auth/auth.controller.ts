import { Router } from 'express'

const router: Router = Router()
import authService from './auth.service'


router.post('/signup', authService.signup)
router.post('/login', authService.login)

router.post('/confirm-email', authService.confirmEmail)







export default router;
