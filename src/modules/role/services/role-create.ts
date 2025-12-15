import { findRoleByNameModel } from "../models/role-read";
import { createRoleModel } from "../models/role-create";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { ActivityContext } from "../../activity/schema/activity-schema";
import { CreateRoleInputSchema, Role } from "../schema/role-schema";

export const createRoleService = withActivityLog<Role>(
  { module: "role", action: "create role" },
  async (
    context: ActivityContext,
    name: string,
    description: string | undefined,
    isSystem: boolean,
    actorId: string
  ) => {
    CreateRoleInputSchema.parse({
      name,
      description: description ?? null,
      isSystem,
    });

    const exists = await findRoleByNameModel(name);
    if (exists) {
      throw new ResponsError(
        Code.CONFLICT,
        `role name ${name} already exists`
      );
    }

    const role = await createRoleModel({
      name,
      description: description ?? null,
      isSystem,
    });

    return {
      userId: actorId,
      result: role,
      beforeData: null,
      afterData: {
        id: role.id,
        name: role.name,
        is_system: role.is_system,
        description: role.description,
      },
    };
  }
);
