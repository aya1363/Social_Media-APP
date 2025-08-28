import { Router } from 'express'
import * as validators from './auth.validation'
import { validation } from '../../middleware/validation.middleware'

const router: Router = Router()
import authService from './auth.service'


router.post('/signup',validation(validators.signup), authService.signup)
router.post('/login',validation(validators.login), authService.login)

router.post('/confirm-email',validation(validators.confirmEmail), authService.confirmEmail)







export default router;
