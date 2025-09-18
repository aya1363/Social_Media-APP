import { Role } from "../../DB/models/user.model";

export const endPoint = {
    profile: [Role.user, Role.admin],
    restoreAccount: [Role.admin],
    hardDeleteAccount:[Role.admin]
}