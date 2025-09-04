import mongoose, { HydratedDocument, models, Schema } from "mongoose";

export enum Gender {
    Male = "male",
    Female = "female",
}
export enum Role {
    admin = "admin",
    user = "user",
}
export enum Provider {
    GOOGLE = "GOOGLE",
    SYSTEM = "system",
}
export interface IUser {
  firstName: string;
  lastName: string;
  userName?: string;
  email: string;
  password: string;
  address?: string;
  phone?: string;
  gender: Gender;
  role: Role;
  picture?: string;
  coverPicture?: string[];
  createdAt: Date;
  updatedAt?: Date;
  confirmEmail?: Date | null;
  confirmEmailOtp?: string | null;
  confirmEmailOtpCreatedAt?: Date | null;
  confirmEmailOtpTries?: number;
resetPasswordOtp?: string | null | undefined;
    
  resetPasswordOtpCreatedAt?: Date | null;
  resetPasswordOtpTries?: number;
  resetPasswordOtpBanned?: Date | null;
  changeCredentialTime?: Date;
  provider: Provider;
  otpBanned?: Date | null;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    password: { type: String, required: true },
    gender: { type: String, enum: Object.values(Gender), default: Gender.Male },
    address: { type: String },

    // Reset password fields
    resetPasswordOtp: { type: String, default: null },
    resetPasswordOtpCreatedAt: { type: Date, default: null },
    resetPasswordOtpTries: { type: Number, default: 0 },
    resetPasswordOtpBanned: { type: Date, default: null },

    changeCredentialTime: Date,
    provider: { type: String, enum: Object.values(Provider), default: Provider.SYSTEM },
    picture: { type: String },
    coverPicture: [String],
    role: { type: String, enum: Object.values(Role), default: Role.user },

    // Email confirmation
    confirmEmail: { type: Date, default: null },
    confirmEmailOtp: { type: String, default: null },
    confirmEmailOtpCreatedAt: { type: Date, default: null },
    confirmEmailOtpTries: { type: Number, default: 0 },
    otpBanned: { type: Date, default: null },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);


userSchema.virtual('userName')
    .set(function (value) {
    const [firstName, lastName] = value.split(' ') || []
    this.set({firstName , lastName})   
    })
    .get(function () {
    return `${this.firstName } ${this.lastName}`
    })


export const userModel = models.User||mongoose.model<IUser>('User', userSchema)
export type HdUserDocument = HydratedDocument<IUser>
