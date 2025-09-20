
import { Response } from "express";

export const successResponse =<T = any | null> (
    { res,
    message = 'Done 🎉',
    statusCode = 200,
        data }:
        {
            res: Response,
            message?: string,
            statusCode?:number,
            data?:T
    }
) => {
     console.log("✅ successResponse CALLED");   // 👈 trace log
    return res.status(statusCode).json({ message, data })
    
}