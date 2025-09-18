import { z } from 'zod'
import { logoutEnum } from '../../utils/security/token.security'
import { generalFields } from '../../middleware/validation.middleware';

export const logout = {
    body: z.strictObject({
        flag:z.enum(logoutEnum).default(logoutEnum.only)
    })
}


export const freezeAccount = {
    params: z.object({
        userId: generalFields.id.optional()
    }
    )
}
export const restoreAccount = {
    params: z.object({
        userId: generalFields.id
    }
    )
}

export const hardDeleteAccount = {
    params: z.object({
        userId: generalFields.id
    }
)}
