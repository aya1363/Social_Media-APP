import { HdUserDocument } from "../../DB/models/user.model"

export interface IProfilePictureResponse{
        url:string
}

export interface IUserResponse  {
    user:Partial<HdUserDocument>
}