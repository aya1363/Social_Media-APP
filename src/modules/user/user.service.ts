import { Request, Response } from "express";
import { Types, UpdateQuery } from "mongoose";
import { DecodedToken } from "request.express";
import { UserRepository } from "../../DB/DBRepository";
import {
  HdUserDocument,
  IUser,
  Role,
  UserModel,
} from "../../DB/models";
import {
  createPreSignUploadUrl,
  DeleteFiles,
  deleteListFolderByPrefix,
  uploadFiles,
} from "../../utils/multer/s3.config";
import { s3Event } from "../../utils/multer/s3.event";
import {
  BadRequestException,
  forBiddenRequestException,
    notFoundRequestException,
  
} from "../../utils/response/error.response";

import {
  getLoginCredentials,
  logoutEnum,
  revokeToken,
} from "../../utils/security/token.security";
import {
  IFreezeAccountBodyInputsDto,
  IHardDeleteAccountBodyInputsDto,
  ILogoutBodyInputsDto,
  IRestoreAccountBodyInputsDto,
} from "./user.dto";
import { storageEnum } from "../../utils/multer/cloud.multer";
import { IUserResponse } from "./user.entities";
import { successResponse } from "../../utils/response/success.response";

class UserService {
  private userModel = new UserRepository(UserModel);

  constructor() {}

  profile = async (req: Request, res: Response): Promise<Response> => {
    return successResponse({
      res,
      data: {
        user: req.user,
        decoded: req.decoded?.iat,
      },
    });
  };
  profilePicture = async (req: Request, res: Response): Promise<Response> => {
    const {
      ContentType,
      originalname,
    }: { ContentType: string; originalname: string } = req.body;
    const { url, Key } = await createPreSignUploadUrl({
      ContentType,
      originalname,
      path: `users/${req.decoded?._id}`,
    });
    const user = this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: {
        profilePicture: Key,
        temporaryProfilePicture: req.user?.profilePicture,
      },
    });
    if (!user) {
      throw new BadRequestException("fail to update user profile picture");
    }
    s3Event.emit("trackProfileImageUpload", {
      userId: req.user?._id,
      oldKey: req.user?.profilePicture,
      Key,
      expiresIn: Number(process.env.AWS_PRE_SIGN_URL_EXPIRES_IN) * 1000,
    });

    return successResponse({ res, data: { url } });
  };

  profileCoverPictures = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const urls = await uploadFiles({
        files: req.files as Express.Multer.File[],
        path: `users/${req.decoded?._id}/cover`,
        storageApproach: storageEnum.disk,
        useLarge:true
    })
    const user =await this.userModel.findByIdAndUpdate({
      id: req.user?._id as Types.ObjectId,
      update: {
          coverPictures: urls
      }
    });

    if (!user) {
      throw new BadRequestException(
        "fail to update user profile cover images "
      );
    }
    if (req.user?.coverPictures) {
      await DeleteFiles({ urls: req.user?.coverPictures });
    }
    return successResponse<IUserResponse>({ res, data: { user } });
  };

  freezeAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IFreezeAccountBodyInputsDto;
    if (userId && req.user?.role !== Role.admin) {
      throw new forBiddenRequestException("not authorized user");
    }
    const user = await this.userModel.updateOne({
      filter: {
        _id: userId || req.user?._id,
        freezedAt: { $exists: false },
      },
      update: {
        freezedAt: new Date(),
        freezedBy: req.user?._id,
        changeCredentialTime: new Date(),
        $unset: {
          restoredAt: 1,
          restoredBy: 1,
        },
      },
    });
    if (!user.matchedCount) {
      throw new notFoundRequestException(
        "user not found or fail to deActive this recourse"
      );
    }

    return successResponse({ res });
  };

  restoreAccount = async (req: Request, res: Response): Promise<Response> => {
    const { userId } = req.params as IRestoreAccountBodyInputsDto;
    if (userId && req.user?.role !== Role.admin) {
      throw new forBiddenRequestException("not authorized user");
    }
    const user = await this.userModel.updateOne({
      filter: {
        _id: userId,
        freezedBy: { $ne: userId },
      },
      update: {
        restoredAt: new Date(),
        restoredBy: req.user?._id,
        $unset: {
          freezedAt: 1,
          freezedBy: 1,
          changeCredentialTime: 1,
        },
      },
    });
    if (!user.matchedCount) {
      throw new notFoundRequestException(" fail to restore this recourse ");
    }

    return successResponse({ res });
  };

  hardDeleteAccount = async (
    req: Request,
    res: Response
  ): Promise<Response> => {
    const { userId } = req.params as IHardDeleteAccountBodyInputsDto;
    const user = await this.userModel.deleteOne({
      filter: {
        _id: userId,
        freezedAt: { $exists: true },
      },
    });
    if (!user.deletedCount) {
      throw new notFoundRequestException(
        "user not found or already hard deleted  "
      );
    }
    await deleteListFolderByPrefix({ path: `/users/${userId}` });

    return successResponse({ res });
  };

  logout = async (req: Request, res: Response): Promise<Response> => {
    const { flag }: ILogoutBodyInputsDto = req.body;
    let statusCode: number = 200;
    let update: UpdateQuery<IUser> = {};
    switch (flag) {
      case logoutEnum.all:
        update.changeCredentialTime = new Date();

        break;

      default:
        await revokeToken({ decoded: req.decoded as DecodedToken });
        statusCode = 201;

        break;
    }
    await this.userModel.updateOne({
      filter: { _id: req.decoded?._id },
      update,
    });
    return successResponse({
      res,
      statusCode,
      data: {
        user: req.user?._id,
        decoded: req.decoded?.iat,
      },
    });
  };

  refreshToken = async (req: Request, res: Response): Promise<Response> => {
    const credentials = await getLoginCredentials(req.user as HdUserDocument);
    await revokeToken({ decoded: req.decoded as DecodedToken });
    return successResponse({ res, data: { credentials } });
  };
}

export default new UserService();
