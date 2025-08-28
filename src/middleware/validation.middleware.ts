import type { NextFunction, Request, Response } from "express";
import { ZodError, ZodType } from "zod";
import { BadRequestException } from "../utils/response/error.response";
import { z } from 'zod'
import { Gender } from '../DB/models/user.model';
type KeyReqType = keyof Request;
type SchemaType = Partial<Record<KeyReqType, ZodType>>;

export const validation = (Schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const validationErrors: Array<{
      key: KeyReqType;
      issues: { message: string; path: string | number | symbol | undefined}[];
    }> = [];

    for (const key of Object.keys(Schema) as (keyof Request & string)[]) {
      if (!Schema[key]) continue;

      const validationResult = Schema[key]!.safeParse(req[key]);
      if (!validationResult.success) {
        const errors = validationResult.error as ZodError;

        validationErrors.push({
            key,
            issues: errors.issues.map((issue) => ({
            message: issue.message,
            path: issue.path[0]?.toString() ?? "",
        })),
        }); }}
    if (validationErrors.length) {
        throw new BadRequestException("validation error", { validationErrors });
    }
    next();
    };
};

export const generalFields =  {
            userName: z.string().min(2).max(20),
            lastName: z.string().min(2).max(20),
            email: z.email(),
            gender: z.enum([Gender.Male, Gender.Female], {
            message: "Gender must be either 'male' or 'female'",
        }),
            password: z.string().
                regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    ),
            confirmPassword: z.string(),
            otp:z.string()
        
            }
            
        
    
