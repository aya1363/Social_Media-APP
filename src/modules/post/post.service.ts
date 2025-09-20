import { Request, Response } from "express";
import { successResponse } from "../../utils/response/success.response";
import { PostRepository, UserRepository } from "../../DB/DBRepository";
import { PostModel, UserModel } from "../../DB/models";

class PostService{
    private postModel = new PostRepository(PostModel)
    private UserModel = new UserRepository(UserModel)

    constructor() { }
    

    createPost = (req:Request, res:Response) :Response=> {
        
        console.log("✅ /posts endpoint hit");
        return successResponse({res })
    }
}
export default new PostService()