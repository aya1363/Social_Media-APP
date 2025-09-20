import { Router } from "express";

import {
  authentication,

} from "../../middleware/authentication.middleware";
import * as validators from "./post.validation";
import { validation } from "../../middleware/validation.middleware";
import {
  cloudFileUpload,
  fileValidation,
  
} from "../../utils/multer/cloud.multer";
import postService from "./post.service";
 "./post.service";
const router = Router();


router.post("/createPost", authentication(),
    cloudFileUpload(
        { validation: fileValidation.image }).array('attachment', 2)
    , validation(validators.createPost),
    postService.createPost);

export default router;