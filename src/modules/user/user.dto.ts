import { z } from "zod";
import { logout } from "./user.validation";
export type ILogoutBodyInputsDto = z.infer<typeof logout.body>