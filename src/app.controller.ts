import { config } from "dotenv";
import {resolve } from 'node:path'
config({path:resolve('./config/.env.development')})
import express from "express";
import type { Request, Response, Express } from 'express'
import cors from 'cors'
import helmet from "helmet";
import { rateLimit } from 'express-rate-limit'
import authController from './modules/auth/auth.controller'
import { connectDB } from "./DB/connection.db";
import { globalErrorHandling } from "./utils/response/error.response";

   const limiter = rateLimit({
        windowMs: 60 * 60000,
        limit: 2000, 
        message: 'error to many request ,please try again later  ',
        statusCode:429
   })
 

const bootstrap = ():void => {
    const app: Express = express()
    const port: number | string = process.env.PORT || 3000
    connectDB();
    app.use(cors(), express.json(), helmet(),limiter)
    
    app.use('/auth', authController)

    
    app.get('/', (req:Request ,res:Response) => {
        res.json({message:`Welcome to ${process.env.APPLICATION_NAME} home page 📱🌼`})
    })
    
    
    app.use('{/*dummy}', (req: Request, res: Response): Response => {
        return res.status(404).json({ message: ' invalid application routing ,please check the method and url ❌' });
    })


    
    //global error handling
    app.use(globalErrorHandling);


    app.listen(port, () => {
        console.log(`server is running on ${port} 🚀`)
})
}

export default bootstrap
