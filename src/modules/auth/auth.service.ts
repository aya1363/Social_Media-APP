
import { Request, Response } from 'express';
import { ApplicationException, BadRequestException, conflictRequestException } from '../../utils/response/error.response';
import userModel from '../../DB/models/user.model';
import { IConfirmEmailBodyInputs, ILoginBodyInputs, ISignupBodyInputs } from './auth.dto'
import * as validators from './auth.validation'
import { compareHash, generateHash } from '../../utils/security/hash.security';
import { emailEvent } from '../../utils/events/email.event';
import { generateOtp } from '../../utils/otp';
import { generateToken } from '../../utils/security/token.security';


class AuthenticationService{

    constructor() { }

signup = async (req: Request, res: Response): Promise<Response> => {

    await validators.signup.body.parseAsync(req.body).catch ((error)=> {
            throw new BadRequestException('validation Error',{issue:JSON.parse(error as string)})})

    const { userName, password, email }: ISignupBodyInputs = req.body;

    const existUser = await userModel.findOne({ email });
    if (existUser) {
      throw new conflictRequestException("User already exists");
    }

    if (!password) {
      throw new ApplicationException("Password is required", 400, { extra: "error" });
    }

    const otp = generateOtp();
    const confirmEmailOtp: string = await generateHash({ plaintext: otp });
    const hashPassword: string = await generateHash({ plaintext: password });

    const user = await userModel.create({
        userName,
        email,
        password: hashPassword,
        gender:req.body.gender,
        confirmEmail: null,                  
        confirmEmailOtp,                     
        confirmEmailOtpCreatedAt: new Date() 
    });

    emailEvent.emit("confirmEmail", { to: email, otp });

    return res.status(201).json({ message: "Signup successfully", data: user });
 
};



confirmEmail = async (req: Request, res: Response): Promise<Response> => {
 
        await validators.confirmEmail.body.parseAsync(req.body).catch ((error)=> {
            throw new BadRequestException('validation Error',{issue:JSON.parse(error as string)})})

        const { email, otp }: IConfirmEmailBodyInputs = req.body;

    const user = await userModel.findOne({
        email,
        confirmEmail: null,
        confirmEmailOtp: { $exists: true }
    });

    if (!user) {
        throw new ApplicationException("Invalid account or already verified", 404);
    }

    
    if (user.otpBanned && user.otpBanned > new Date()) {
        throw new ApplicationException("Too many invalid attempts, try later", 429);
    }

    
    const otpLifeTime = 2 * 60 * 1000; 
    if (
        user.confirmEmailOtpCreatedAt &&
        Date.now() - user.confirmEmailOtpCreatedAt.getTime() > otpLifeTime
    ) {
        throw new ApplicationException("OTP expired, please request a new one", 400);
    }

    if (!user.confirmEmailOtp) {
        throw new ApplicationException("OTP not found", 400);
}

    const isValidOtp = await compareHash({
        plaintext: otp,
        hashValue: user.confirmEmailOtp,
});

    if (!isValidOtp) {
        user.confirmEmailOtpTries = (user.confirmEmailOtpTries || 0) + 1;

    if (user.confirmEmailOtpTries >= 5) {
        user.otpBanned = new Date(Date.now() + 1 * 60 * 1000); 
    }

        await user.save();
        throw new BadRequestException("Invalid OTP");
    }

   
        await userModel.updateOne(
        { email },
        {
        $set: {
            confirmEmail: new Date(),
            confirmEmailOtp: null,
            confirmEmailOtpCreatedAt: null,
            confirmEmailOtpTries: 0,
            otpBanned: null,
        },
}
    );

    return res.status(200).json({ message: "Email confirmed successfully 🎉" }); 
    };
    resendOtp = async(req:Request, res:Response):Promise<Response> => {
        
        return res.status(200).json({message:'resend otp successfully' , data:req.body})
    }



    login = async(req: Request, res: Response): Promise<Response> => {
        await validators.login.body.parseAsync(req.body).catch((error) => {
            throw new BadRequestException('validation error',{issue:JSON.parse(error as string)})
        })
        const { email, password }: ILoginBodyInputs = req.body
        const user = await userModel.findOne({
            email, confirmEmail: { $exists: true },
            confirmEmailOtp: { $exists: true }
        })
        if (!user) {
            throw new ApplicationException('user not authenticated', 401)
        }
        const match = await compareHash({ plaintext: password, hashValue: user.password })
        if (!match) {
            throw new ApplicationException('invalid login data ', 404)
        }
        const access_Token = await generateToken({
            payload: { _id: user._id },
            options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN) }
        });
        
        const refresh_Token = await generateToken({
            payload: { _id: user._id },
            options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN) }
});


    
        return res.status(200).json({message:'login successfully 🎉' , data:{access_Token ,refresh_Token}})
    }
}






export default new AuthenticationService()