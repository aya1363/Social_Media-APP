import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IPost as TDocument } from "../models";


export class PostRepository extends DatabaseRepository<TDocument>{

    constructor(protected readonly model:Model<TDocument>) {
        super(model)
     }
    

}