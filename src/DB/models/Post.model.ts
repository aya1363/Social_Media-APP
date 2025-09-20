import { HydratedDocument, model, models, Schema, Types } from "mongoose";


export enum allowCommentsEnum {
    allow = 'allow',
    deny = 'deny'
    
}
export enum postPrivacyEnum {
    public = 'public',
    friends = 'friends',
    onlyMe = 'only-me'
}
export interface IPost{
    tags?:Types.ObjectId[]
    likes?: Types.ObjectId[]
    content?: string
    attachment?: string[]
    assetFolderId: string[]
  
    

    allowComment: allowCommentsEnum,
    postPrivacy: postPrivacyEnum
    createdBy:Types.ObjectId
    freezedBy?: Types.ObjectId
    freezedAt?:Date
    restoredBy?: Types.ObjectId
    restoredAt?: Date
    createdAt?: Date
    updatedAt?: Date
    
}
export type HPostDocument = HydratedDocument<IPost>

const postSchema = new Schema<IPost>({

    tags: { type: [Schema.Types.ObjectId ]},
    
    likes: { type: [Schema.Types.ObjectId ]},
    
    content: {
        type: String,
        minLength: 6, maxLength: 500000,
        required: function () {
            return !this.attachment?.length
        }
        
    },
    assetFolderId: {
        type: [String],
        required:true
    },
    
    attachment: { type: [String]  },
    
    allowComment: {
        type: String, 
        enum: Object.values(allowCommentsEnum),
        default:allowCommentsEnum.allow
    },
    
    postPrivacy: {
        type: String,
        enum: Object.values(postPrivacyEnum),
        default:postPrivacyEnum.public
     },
    
    createdBy: {
        type: Schema.Types.ObjectId
        , ref: 'User',
        required:true
    },
    
    freezedBy: {
        type: Schema.Types.ObjectId
        , ref: 'User'
    },
    
    freezedAt: { Date },
    
    restoredBy: {
        type: Schema.Types.ObjectId
        , ref: 'User'
    },
    
    restoredAt:{ Date}
   
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON:{virtuals:true}
})


export const PostModel= models.Post ||model<IPost>('Post', postSchema)