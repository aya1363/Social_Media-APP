import { Router } from "express";
import userService from "./user.service";
import {
  authentication,
  authorization,
} from "../../middleware/authentication.middleware";
import * as validators from "./user.validation";
import { validation } from "../../middleware/validation.middleware";
import { tokenEnum } from "../../utils/security/token.security";
import {
  cloudFileUpload,
  fileValidation,
  storageEnum,
} from "../../utils/multer/cloud.multer";
import { endPoint } from "./user.authorization";
const router = Router();

router.get("/", authentication(), userService.profile);

router.patch("/profile-image", authentication(), userService.profilePicture);

router.patch(
  "/profile-cover-images",
  authentication(),
  cloudFileUpload({
    validation: fileValidation.image,
    storageApproach: storageEnum.disk,
    maxSizeMB: 2,
  }).array("images", 2),
  userService.profileCoverPictures
);

router.delete(
  "{/:userId}/freeze-account",
  authentication(),
  validation(validators.freezeAccount),
  userService.freezeAccount
);

router.delete(
  "/:userId/hard-delete-account",
  authorization(endPoint.hardDeleteAccount),
  validation(validators.hardDeleteAccount),
  userService.hardDeleteAccount
);

router.patch(
  "/:userId/restore-account",
  authorization(endPoint.restoreAccount),
  validation(validators.restoreAccount),
  userService.restoreAccount
);

router.post(
  "/logout",
  authentication(),
  validation(validators.logout),
  userService.logout
);

router.post(
  "/refresh-token",
  authentication(tokenEnum.refresh),
  userService.refreshToken
);

export default router;
