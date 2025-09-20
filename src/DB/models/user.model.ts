import mongoose, { HydratedDocument, models, Schema, Types } from "mongoose";
import { generateHash } from "../../utils/security/hash.security";
import { emailEvent } from "../../utils/email/email.event";

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
  profilePicture?: string;
  temporaryProfilePicture?: string;

  coverPictures?: string[];
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
  freezedAt?: Date, 
  freezedBy?: Types.ObjectId
  restoredAt?: Date, 
  restoredBy?: Types.ObjectId
  twoFactorEnabled?: boolean;
twoFactorOtp?: string | null;
twoFactorOtpCreatedAt?: Date | null;
  twoFactorOtpTries?: number;
  
}
export type HdUserDocument = HydratedDocument<IUser>

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
    profilePicture: { type: String },
    temporaryProfilePicture:{type: String},
    coverPictures: [String],
    role: { type: String, enum: Object.values(Role), default: Role.user },

    // Email confirmation
    confirmEmail: { type: Date, default: null },
    confirmEmailOtp: { type: String, default: null },
    confirmEmailOtpCreatedAt: { type: Date, default: null },
    confirmEmailOtpTries: { type: Number, default: 0 },
    otpBanned: { type: Date, default: null },
    freezedAt: {type:Date}, 
    freezedBy: {
      type: Schema.Types.ObjectId, 
    ref:'User'
  },
    restoredAt: {type:Date}, 
    restoredBy: {
      type: Schema.Types.ObjectId,
    ref:'User'
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    twoFactorOtp: {
      type: String,
      default: null
    },
    twoFactorOtpCreatedAt: {
      type: Date,
      default: null
    },
    twoFactorOtpTries: {
      type: Number,
      default: 0
    },

    
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
userSchema.pre('save', async function (
  this: HdUserDocument & { wasNew: boolean, confirmEmailPlainOtp?: string }
  , next) {
  console.log(this);
  this.wasNew = this.isNew
  if (this.isModified('password')) {
    this.password = await generateHash({plaintext:this.password})
  }
  if (this.isModified('confirmEmailOtp')) {
    this.confirmEmailPlainOtp= this.confirmEmailOtp as string
    this.confirmEmailOtp = await generateHash({plaintext:this.confirmEmailOtp  as string} )
  } 
  next()
      
})
    
userSchema.post('save',async function(doc, next)  {
  const that = this as HdUserDocument & {
    wasNew: boolean,
    confirmEmailPlainOtp?: string
  };
  if (that.wasNew && that.confirmEmailPlainOtp) {
    emailEvent.emit('confirmEmail', {
      to: this.email,
      otp: that.confirmEmailPlainOtp
    })

  }


  next()
})




export const UserModel = models.User||mongoose.model<IUser>('User', userSchema)
