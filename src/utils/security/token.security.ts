import jwt, { JwtPayload, Secret, SignOptions } from "jsonwebtoken";
import { v4 as uuid} from 'uuid'
import { HdUserDocument, Role, userModel } from "../../DB/models/user.model";
import { BadRequestException, unAuthorizedRequestException } from "../response/error.response";
import { UserRepository } from "../../DB/DBRepository/user.repository";
import { HTokenDocument, TokenModel } from "../../DB/models/Token.model";
import { tokenRepository } from "../../DB/DBRepository/token.repository";
import mongoose from "mongoose";
import { DecodedToken } from "request.express";

export enum signatureLevelEnum{
  Bearer = 'Bearer',
  System='System'
}
interface GenerateTokenParams {
  payload:  object 
  secret?: string;
  options?: SignOptions;
}
interface VerifyTokenParams {
token:string,
  secret?: Secret;

}
export enum tokenEnum {
  access = 'access',
    refresh='refresh'
}
export enum logoutEnum{
  only = 'only',
  all = 'all'
}

export interface RevokeTokenParams {
decoded: DecodedToken;}

export const generateToken = async ({
  payload,
  secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
  options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN )},
}: GenerateTokenParams): Promise<string> => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = async({token='',secret = process.env.ACCESS_USER_TOKEN_SIGNATURE as string }:VerifyTokenParams):Promise< JwtPayload >=> {
    return jwt.verify(token ,secret ) as JwtPayload
}
export const detectSignature = async (role: Role = Role.user):Promise<signatureLevelEnum> => {
  
  let signatureLevel: signatureLevelEnum = signatureLevelEnum.Bearer
  switch (role) {
    case Role.admin:
      signatureLevel=signatureLevelEnum.System
      break;
    default:
      signatureLevel=signatureLevelEnum.Bearer
      break;
  }
  return signatureLevel
}
export const getSignature = async ( signatureLevel: signatureLevelEnum = signatureLevelEnum.Bearer):Promise<{ access_signature: string, refresh_signature:string}> => {
  let signatures: { access_signature: string, refresh_signature:string} ={access_signature:'' , refresh_signature:''}
  
  switch (signatureLevel) {
    case signatureLevelEnum.System:
        signatures.access_signature = process.env.ACCESS_SYSTEM_TOKEN_SIGNATURE as string,
        signatures.refresh_signature =process.env.REFRESH_SYSTEM_TOKEN_SIGNATURE as string
      break;
    default:
        signatures.access_signature = process.env.ACCESS_USER_TOKEN_SIGNATURE as string,
        signatures.refresh_signature =process.env.REFRESH_USER_TOKEN_SIGNATURE as string
      break;
  }
  return signatures
}

export const getLoginCredentials =async (user:HdUserDocument) => {
    
  const signatureLevel = await detectSignature(user.role)

  const signature = await getSignature(signatureLevel)
  console.log(signature);
  const jwtid = uuid()
  const access_Token = await generateToken({
    payload: { _id: user._id },
    secret:signature.access_signature,
            options: { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN),jwtid }
        });
    
        const refresh_Token = await generateToken({
          payload: { _id: user._id },
          secret:signature.refresh_signature,
            options: { expiresIn: Number(process.env.REFRESH_TOKEN_EXPIRES_IN),jwtid }
        });
  return {access_Token , refresh_Token}
}

export const decodeToken = async (
  { authorization,
    tokenType = tokenEnum.access
  }:
  { authorization: string , tokenType ?:tokenEnum}) => {
  
  const [ bearerKey, token ]= authorization.split(' ')
  if (! bearerKey || !token) {
    throw new unAuthorizedRequestException('missing token parts')
  }
  const UserModel = new UserRepository(userModel)
  const tokenModel = new tokenRepository(TokenModel)

  const signatures = await getSignature(bearerKey as signatureLevelEnum)
  const decoded = await verifyToken({
    token,
    secret: tokenType === tokenEnum.refresh ?
      signatures.refresh_signature :
      signatures.access_signature
  })
  if (!decoded?._id || !decoded.iat) {
    throw new BadRequestException('invalid token payload ')
  }
  if (await tokenModel.findOne({filter:{jti:decoded.jti}})) {
      throw new unAuthorizedRequestException('invalid or old login credential ')
  }
  const user = await UserModel.findOne({ filter: { _id: decoded._id } })
  if (!user) {
    throw new BadRequestException('you are not registered account ')
  }
  if (user.changeCredentialTime?.getTime() ||0 > decoded.iat * 1000) {
    
    throw new unAuthorizedRequestException('invalid or old login credential ')
   
  }
   console.log("Decoded token:", decoded);
  return { user, decoded }
 
}

export const revokeToken = async ({ decoded }: RevokeTokenParams):Promise<HTokenDocument> => {
  const tokenModel = new tokenRepository(TokenModel);

  const [result] = await tokenModel.create({
    data: [
      {
        jti: decoded.jti,
        expiresIn: decoded.iat + Number(process.env.REFRESH_TOKEN_EXPIRES_IN),
        userId: new mongoose.Types.ObjectId(decoded._id),
      },
    ],
  }) || []
  if (!result ) {
    throw new BadRequestException('fail to revoke this token ')
  }
  return result; 
};