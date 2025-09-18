import type { NextFunction ,Request,Response} from "express"
import { BadRequestException, forBiddenRequestException } from "../utils/response/error.response";
import { decodeToken, tokenEnum } from "../utils/security/token.security";
import { DecodedToken } from "request.express";
import { Role } from "../DB/models/user.model";

export const authentication = (tokenType:tokenEnum = tokenEnum.access) => {
    return async(req:Request ,res:Response ,next:NextFunction) => {
        
        if (!req.headers.authorization) {
            throw new BadRequestException("validation Error", {
                key:'headers' ,
                issues:[{path :'authorization',message:'missing authorization'}]
            })
        }
        const { decoded, user } = await decodeToken({
            authorization: req.headers.authorization,
            tokenType 
        })
       
        
        req.user = user;
      //  console.log(typeof req.user._id);
        
        req.decoded = decoded as DecodedToken
        // console.log({typeDecoded:typeof req.decoded?._id});
         next()
    }
    
}


export const authorization = (
    accessRoles: Role[] = [],
    tokenType: tokenEnum = tokenEnum.access) => {
    return async(req:Request ,res:Response ,next:NextFunction) => {
        
        if (!req.headers.authorization) {
            throw new BadRequestException("validation Error", {
                key:'headers' ,
                issues:[{path :'authorization',message:'missing authorization'}]
            })
        }
        const { decoded, user } = await decodeToken({
            authorization: req.headers.authorization,
            tokenType
        })
        if (!accessRoles .includes(user.role)) {
            throw new forBiddenRequestException('not authorized account ')
        }
    
        
        req.user = user;
        //console.log(typeof req.user._id);
        
        req.decoded = decoded as DecodedToken
         //console.log({typeDecoded:typeof req.decoded?._id});
        next()
    }
    
}
