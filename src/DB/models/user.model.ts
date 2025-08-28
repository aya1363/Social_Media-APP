import mongoose, { Schema } from "mongoose";

export enum Gender {
    Male = "male",
    Female = "female",
}
export enum Role {
    admin = "admin",
    user = "user",
}
export interface IUser extends Document {
    firstName: string,
    lastName: string,
    userName?:string,
    email: string,
    password: string,
    phone: string,
    gender: Gender,
    role:Role,
    createdAt: Date,
    updatedAt?:Date,
    confirmEmail?: Date | null;                 
    confirmEmailOtp?: string | null;            
    confirmEmailOtpCreatedAt?: Date | null;     
    confirmEmailOtpTries?: number;             
    otpBanned?: Date | null;                    
}


const userSchema: Schema<IUser> = new mongoose.Schema({
    
    firstName: {
        type: String,
        required:true 
    },
    lastName: {
        type: String,
        required:true 
    },
    email: {
        type: String,
        required: true,
        unique:true
    },

    phone: String ,
    
    password: {
        type: String,
        required: true
    },
    gender: {
        type: String,
        enum: Object.values(Gender), 
        default: Gender.Male,        
    },
    role: {
        type: String,
        
        enum: Object.values(Role), 
        default: Role.user, 
    },
   confirmEmail: { type: Date, default: null },
  confirmEmailOtp: { type: String, default: null },
  confirmEmailOtpCreatedAt: { type: Date, default: null },
  confirmEmailOtpTries: { type: Number, default: 0 },
  otpBanned: { type: Date, default: null }

},
    {
        timestamps: true,
        toObject: { virtuals: true },
        toJSON:{ virtuals: true }
    })

userSchema.virtual('userName')
    .set(function (value) {
    const [firstName, lastName] = value.split(' ') || []
    this.set({firstName , lastName})   
    })
    .get(function () {
    return `${this.firstName } ${this.lastName}`
    })


const userModel = mongoose.model<IUser>('User', userSchema)
export default userModel