
import { Request, Response } from 'express';
import {
    BadRequestException, conflictRequestException,
    notFoundRequestException, TooManyRequestsException,
    
} from '../../utils/response/error.response';

import {Provider, UserModel} from '../../DB/models';
import {  IConfirmEmailBodyInputsDto,  IGmail,  ILoginBodyInputsDto, ISignupBodyInputsDto } from './auth.dto'
import * as validators from './auth.validation'
import { compareHash, generateHash } from '../../utils/security/hash.security';
import { emailEvent } from '../../utils/email/email.event';
import { generateOtp } from '../../utils/otp';
import { getLoginCredentials } from '../../utils/security/token.security';
import {OAuth2Client, type TokenPayload} from 'google-auth-library';

import { UserRepository } from '../../DB/DBRepository';
import { successResponse } from '../../utils/response/success.response';


class AuthenticationService{
    private userModel= new UserRepository(UserModel)
    private async verifyGmailAccount(idToken:string):Promise<TokenPayload> {
        const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.WEB_CLIENT_ID?.split(',')|| [], 
  });
    const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new BadRequestException("fail to verify this google account");
        }
    return payload
 }

    constructor() { }
    /**
     * 
     * @param req Express.Request
     * @param res Express.Response
     * @returns Promise<Response>
     * @example({ userName, password, email }:ISignupBodyInputs)
     * return {message'done',statusCode:201}
     */

signup = async (req: Request, res: Response): Promise<Response> => {

    await validators.signup.body.parseAsync(req.body).catch ((error)=> {
            throw new BadRequestException('validation Error',{issue:JSON.parse(error as string)})})

    const { userName, password, email }: ISignupBodyInputsDto = req.body;

    const existUser = await this.userModel.findOne({
        filter: {email},
        select: 'email',
        options: {
            lean: false
            //, populate: [{ path: 'userName' }]
    }});
    if (existUser?._id) {
        throw new conflictRequestException("User already exists");
    }

    if (!password) {
        throw new BadRequestException("Password is required");
    }

    const otp = generateOtp();
   // const confirmEmailOtp: string = await generateHash({ plaintext: otp });
   // const hashPassword: string = await generateHash({ plaintext: password });
    await this.userModel.createUser({
    data: [
    {
        userName,
        email,
        password,
        gender: req.body.gender,
        confirmEmail: null,
        confirmEmailOtp:`${otp}`
    },
],
    options: { validateBeforeSave: true },
});

    emailEvent.emit("confirmEmail", { to: email, otp });

    return successResponse({ res, statusCode: 201})
    

};



confirmEmail = async (req: Request, res: Response): Promise<Response> => {

        await validators.confirmEmail.body.parseAsync(req.body).catch ((error)=> {
            throw new BadRequestException('validation Error',{issue:JSON.parse(error as string)})})

        const { email, otp }: IConfirmEmailBodyInputsDto = req.body;

    const user = await this.userModel.findOne({filter:
        { email,
        confirmEmail: null,
        confirmEmailOtp: { $exists: true }}
    });

    if (!user) {
        throw new notFoundRequestException("Invalid account or already verified");
    }

    
    if (user.otpBanned && user.otpBanned > new Date()) {
        throw new TooManyRequestsException("Too many invalid attempts, try later");
    }

    
    const otpLifeTime = 2 * 60 * 1000; 
    if (
        user.confirmEmailOtpCreatedAt &&
        Date.now() - user.confirmEmailOtpCreatedAt.getTime() > otpLifeTime
    ) {
        throw new BadRequestException("OTP expired, please request a new one");
    }

    if (!user.confirmEmailOtp) {
        throw new notFoundRequestException("OTP not found");
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

   
    await this.userModel.updateOne({
        filter:  {email} ,
        update: {
        $set: {
        confirmEmail: new Date(),
        confirmEmailOtp: null,
        confirmEmailOtpCreatedAt: null,
        confirmEmailOtpTries: 0,
        otpBanned: null,
    },
  },
  options: { runValidators: true }, 
});
        return successResponse({ res })
    
    };
    resendOtp = async(req:Request, res:Response):Promise<Response> => {
        
        return successResponse({res })
    }



    login = async(req: Request, res: Response): Promise<Response> => {
        await validators.login.body.parseAsync(req.body).catch((error) => {
            throw new BadRequestException('validation error',{issue:JSON.parse(error as string)})
        })
        const { email, password }: ILoginBodyInputsDto = req.body
        const user = await this.userModel.findOne({
            filter:
            {
                email,
                confirmEmail: { $exists: true },
                confirmEmailOtp: { $exists: true }}}
        )
        if (!user) {
            throw new notFoundRequestException('In-valid login data')
    
        }
        if (!user.confirmEmail) {
            throw new BadRequestException('verify your account first')
        }
        const match = await compareHash({ plaintext: password, hashValue: user.password })
        if (!match) {
            throw new notFoundRequestException('In-valid login data ')
        }
     const credentials = await getLoginCredentials(user)


    
        return successResponse({ res, data: { credentials } })
        
    }

    signupWithGmail = async (req: Request, res: Response): Promise<Response> => {

        const { idToken }:IGmail = req.body
        const { email, family_name, given_name,
        //    name ,
            picture }: TokenPayload
            = await this.verifyGmailAccount(idToken)
        
        const user = await this.userModel.findOne({
            filter:{email }
        })
        if (user) {
            if (user.provider === Provider.GOOGLE) {
                return await  this.loginWithGmail(req,res)
            }
            throw new conflictRequestException(`Email exist with another provider :: ${user.provider}` )
        }
        const [newUser] = await this.userModel.create({
            data: [{
                firstName: given_name as string
                , lastName: family_name as string ,
                profilePicture:picture  as string ,
                confirmEmail:new Date()
            }]
        }) || []
        if (! newUser) {
            throw new BadRequestException("fail to sign up with gmail ");
            
        }
        const credentials = await getLoginCredentials(newUser)
                return successResponse({res , data:{credentials}})

    }

        loginWithGmail = async (req: Request, res: Response): Promise<Response> => {

        const { idToken }:IGmail = req.body
        const { email}: TokenPayload
            = await this.verifyGmailAccount(idToken)
        
        const user = await this.userModel.findOne({
            filter:{email ,provider:Provider.GOOGLE }
        })
        if (!user) {
            throw new notFoundRequestException(`not registered account or registered with another provider ` )
        }
    
        const credentials = await getLoginCredentials(user)
                return res.status(200).json({message:'login with gmail successfully 🎉' , data:{credentials}})

    }
    sendForgotPassword = async (req: Request, res: Response): Promise<Response> => {
    const { email } = req.body;
    const otp = await generateOtp();

    const hashedOtp = await generateHash({ plaintext: otp });

    const user = await this.userModel.findOneAndUpdate({
    filter: {
    email,
    confirmEmail: { $exists: true },
    provider: Provider.SYSTEM,
},
    update: {
    resetPasswordOtp: hashedOtp,
},
    options: { new: true, runValidators: true },
});


  if (!user) {
    throw new Error("Invalid account");
  }

  emailEvent.emit("sendForgetPassword", {
    to: email,
    subject: "Forgot password",
    title: "Reset password",
    otp, // send plain OTP in email
  });

  return res.json({ message: "OTP sent successfully" });
};



verifyForgotPasswordOtp = async (req: Request, res: Response): Promise<Response> => {
    const { email, otp } = req.body;


    const user = await this.userModel.findOne({ filter:{email} });

    if (!user) {
    throw new Error("User not found");
}


    if (!user.resetPasswordOtp) {
        throw new Error("No OTP found for this user");
}

    const isMatch = await compareHash({
    plaintext: otp,
    hashValue: user.resetPasswordOtp
});

if (!isMatch) {
    throw new Error("Invalid OTP");
  }

return res.json({ message: "OTP verified successfully" });
};




        resetPassword = async (req: Request, res: Response): Promise<Response> =>{
    const { email, newPassword } = req.body;

    const user = await this.userModel.findOne({ filter:{email} })
    if (!user) {
        throw new Error("User not found");
    }

    if (!user.resetPasswordOtp) {
        throw new Error("You must verify OTP first");
    }

    
    const hashedPassword = await generateHash(newPassword)
    user.password = hashedPassword;
    user.resetPasswordOtp = undefined;

    await user.save();

    return res.json({ message: "Password reset successfully" });
}

}






export default new AuthenticationService()

