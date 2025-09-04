import { Model } from "mongoose";
import { DatabaseRepository } from "./database.repository";
import { IToken as TDocument } from "../models/Token.model";


export class tokenRepository extends DatabaseRepository<TDocument>{

    constructor(protected readonly model:Model<TDocument>) {
        super(model)
     }
    

}