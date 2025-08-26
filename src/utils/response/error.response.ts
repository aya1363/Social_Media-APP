import { NextFunction, Request, Response } from "express";

export interface IError extends Error{
    statusCode: number
}

export class ApplicationException extends Error {

    constructor(
        message: string,
        public statusCode: number,
        cause?: unknown)
    {
        super(message , {cause})
        this.name = this.constructor.name
        Error.captureStackTrace(this , this.constructor)
    }
}

export class BadRequestException extends ApplicationException {
    constructor(message: string, cause?: unknown) {
    super(message, 400, cause); 
    }
}
export class conflictRequestException extends ApplicationException {
    constructor(message: string, cause?: unknown) {
    super(message, 409, cause); 
    }
}

export const globalErrorHandling = (error: IError,
    req: Request,
    res: Response,
    next: NextFunction) => {
        res.status( error.statusCode || 500).json({
            message: error.message || 'Internal Server Error',
            stack: process.env.MOOD === 'development' ? error.stack : undefined,
            cause:error.cause
        });
    }