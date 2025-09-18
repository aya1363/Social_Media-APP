import { z } from "zod";
import { freezeAccount, logout, restoreAccount } from "./user.validation";
export type ILogoutBodyInputsDto = z.infer<typeof logout.body>
export type IFreezeAccountBodyInputsDto = z.infer<typeof freezeAccount.params>
export type IRestoreAccountBodyInputsDto = z.infer<typeof restoreAccount.params>
export type IHardDeleteAccountBodyInputsDto =IRestoreAccountBodyInputsDto