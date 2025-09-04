import { Router } from "express";
import  userService from './user.service'
import {  authentication } from "../../middleware/authentication.middleware";
import * as validators from './user.validation'
import { validation } from "../../middleware/validation.middleware";
import { tokenEnum } from "../../utils/security/token.security";
const router = Router()

router.get('/', authentication(), userService.profile)
router.post('/logout', authentication(),validation(validators.logout ),userService.logout)
router.post('/refresh-token', authentication(tokenEnum.refresh ),userService.refreshToken)

export default router