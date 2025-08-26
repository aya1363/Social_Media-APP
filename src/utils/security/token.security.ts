import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";

interface GenerateTokenParams {
  payload: string | object | Buffer;
  secret?: string;
  options?: SignOptions;
}
interface VerifyTokenParams {
token:string,
  secret?: string;
 
}

export const generateToken = async ({
  payload,
  secret = process.env.ACCESS_SIGNATURE as string,
  options = { expiresIn: Number(process.env.ACCESS_TOKEN_EXPIRES_IN )},
}: GenerateTokenParams): Promise<string> => {
  return jwt.sign(payload, secret, options);
};

export const verifyToken = ({token='',secret = process.env.ACCESS_SIGNATURE as string }:VerifyTokenParams):string | JwtPayload => {
    return jwt.verify(token ,secret )
}