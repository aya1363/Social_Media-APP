import { Request, Response } from "express";
import { ILogoutBodyInputsDto } from "./user.dto";
import { getLoginCredentials, logoutEnum, revokeToken } from "../../utils/security/token.security";
import { HdUserDocument, IUser, userModel } from "../../DB/models/user.model";
import  { UpdateQuery } from "mongoose";
import { UserRepository } from "../../DB/DBRepository/user.repository";
import { DecodedToken } from "request.express";
//import { tokenRepository } from "../../DB/DBRepository/token.repository";
//import { TokenModel } from "../../DB/models/Token.model";





class UserService{
    private userModel = new UserRepository(userModel)
   // private tokenModel= new tokenRepository(TokenModel)

    constructor() { }  
    
    profile = async (req:Request ,res:Response ):Promise<Response> => {

        return res.json({
            message: 'Done', data: {
                user: req.user,
                decoded:req.decoded?.iat
        }})
    }

    logout =async (req:Request ,res:Response ):Promise<Response> => {
        const { flag }: ILogoutBodyInputsDto = req.body 
        let statusCode:number =200
        let update : UpdateQuery<IUser> = {}
        switch (flag) {
            case logoutEnum.all:
                update.changeCredentialTime = new Date()
                
                break;
        
            default:
                await revokeToken({ decoded: req.decoded as DecodedToken });
                statusCode=201

                break;
        }
        await this.userModel.UpdateOne({
            filter: { _id: req.decoded?._id },
            update
        } )
        return res.status(statusCode).json({
            message: 'Done logout successfully  ' , data: {
                user: req.user?._id,
                decoded:req.decoded?.iat
        } })
    }

    refreshToken=  async (req:Request ,res:Response ):Promise<Response> => {
    const credentials = await getLoginCredentials(req.user as HdUserDocument)
    await revokeToken({ decoded: req.decoded as DecodedToken });
        return res.status(201).json({
            message: 'Done', data: {credentials}
        })
    }
}


export default new UserService()