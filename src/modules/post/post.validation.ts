import { z } from "zod";
import { allowCommentsEnum, postPrivacyEnum } from "../../DB/models";
import { generalFields } from "../../middleware/validation.middleware";

export const createPost = {
    body: z.strictObject({
        content: z.string().min(2).max(50000).optional(),
        attachment: z.array(z.any()).max(2).optional(),
        allowComments: z.enum(allowCommentsEnum).default(allowCommentsEnum.allow),
        postPrivacy: z.enum(postPrivacyEnum).default(postPrivacyEnum.public),
        tags:z.array(generalFields.id).max(10).optional()
    }).superRefine((data , ctx) => {
        if (!data.attachment?.length && ! data.content) {
            ctx.addIssue({
                code: 'custom',
                path: ['content'],
                message:'sorry we con not make post without content or attachment'
            })
        }
    })
}