import { z } from 'zod'

export const signup = {
    body: z.object({
        userName: z.string().min(2).max(20),
       // lastName: z.string().min(2).max(20),
        email: z.email(),
        password: z.string().
            regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
),
        confirmPassword:z.string()
    })
}

export const confirmEmail = {
    body: z.object({
        email: z.email(),
        otp:z.string()
    })
}

export const login = {
    body: z.object({
        email: z.email(),
        password:z.string()
    })
}