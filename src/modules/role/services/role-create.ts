import { createRoleModel } from "../models/role-create";
import { findRoleByNameModel } from "../models/role-read";
import { RoleInterface } from "../../../interfaces/role-interface";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { ActivityContextInterface } from "../../../interfaces/activity-interface";

export const createRoleService = withActivityLog<RoleInterface>(
  { module: "role", action: "create role" },
 async (context: ActivityContextInterface, name: string, description: string | undefined, isSystem: boolean, actorId: string) => {
    const exists = await findRoleByNameModel(name);
    if (exists)
      throw new ResponsError(
        Code.CONFLICT,
        `role name ${name} already exists`
      );
    const role = await createRoleModel(name, description ?? null, isSystem ?? false);
    return {
      userId: actorId,
      result: role,
      before: null,
      after: {
        id: role.id,
        name: role.name,
        is_system: role.is_system,
        description: role.description
      }
    };
  }
);