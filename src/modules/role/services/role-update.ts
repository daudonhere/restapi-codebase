import {
  findRoleByIdModel,
  findRoleByNameModel,
} from "../models/role-read";
import { updateRoleModel } from "../models/role-update";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { ActivityContext } from "../../activity/schema/activity-schema";
import { UpdateRoleInputSchema } from "../schema/role-schema";

export const updateRoleService = withActivityLog(
  { module: "role", action: "update role" },
  async (
    context: ActivityContext,
    id: string,
    name: string,
    description: string | undefined,
    actorId: string
  ) => {
    UpdateRoleInputSchema.parse({
      id,
      name,
      description: description ?? null,
    });

    const before = await findRoleByIdModel(id);
    if (!before) {
      throw new ResponsError(Code.NOT_FOUND, "role not found");
    }

    if (before.is_system) {
      throw new ResponsError(
        Code.FORBIDDEN,
        "cannot edit a system role"
      );
    }

    const exists = await findRoleByNameModel(name);
    if (exists && exists.id !== id) {
      throw new ResponsError(
        Code.CONFLICT,
        `role name ${name} already exists`
      );
    }

    const updated = await updateRoleModel({
      id,
      name,
      description: description ?? null,
    });

    return {
      userId: actorId,
      result: updated,
      beforeData: before,
      afterData: updated,
    };
  }
);
