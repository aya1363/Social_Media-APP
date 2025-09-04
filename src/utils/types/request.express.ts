import { JwtPayload } from "jsonwebtoken";
import { HdUserDocument } from "../../DB/models/user.model";

export interface DecodedToken extends JwtPayload {
  _id: string;
  jti: string;
  iat: number;
}

import "express";

declare module "express-serve-static-core" {
  interface Request {
    user?: HdUserDocument
    decoded?: DecodedToken
  }
}

