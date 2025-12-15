import {
  findRoleByIdModel,
  countUsersInRoleModel,
} from "../models/role-read";
import {
  deleteRoleModel,
  deleteBulkRolesModel,
} from "../models/role-delete";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { ActivityContext } from "../../activity/schema/activity-schema";
import { RoleIdSchema, BulkRoleIdsSchema } from "../schema/role-schema";

export const deleteRoleService = withActivityLog(
  { module: "role", action: "delete role" },
  async (context: ActivityContext, id: string, actorId: string) => {
    RoleIdSchema.parse({ id });

    const role = await findRoleByIdModel(id);
    if (!role) throw new ResponsError(Code.NOT_FOUND, "role not found");
    if (role.is_system)
      throw new ResponsError(
        Code.FORBIDDEN,
        "cannot delete a system role"
      );

    const users = await countUsersInRoleModel(id);
    if (users > 0) {
      throw new ResponsError(
        Code.CONFLICT,
        `cannot delete role, ${users} users are assigned`
      );
    }

    await deleteRoleModel(id);

    return {
      userId: actorId,
      result: undefined,
      beforeData: role,
      afterData: { deleted: true },
      description: `role ${id} deleted`,
    };
  }
);

export const deleteBulkRolesService = withActivityLog(
  { module: "role", action: "bulk delete role" },
  async (context: ActivityContext, roleIds: string[], actorId: string) => {
    BulkRoleIdsSchema.parse({ roleIds });

    const { deletedIds, skipped } = await deleteBulkRolesModel(roleIds);

    const deletedCount = deletedIds.length;

    const hasForbidden = skipped.some((s) => s.reason === "is_system");
    const hasConflict = skipped.some((s) => s.reason === "in_use");
    const hasNotFound = skipped.some((s) => s.reason === "not_found");

    if (deletedCount === 0) {
      if (hasForbidden)
        throw new ResponsError(
          Code.FORBIDDEN,
          "cannot delete system roles"
        );
      if (hasConflict)
        throw new ResponsError(
          Code.CONFLICT,
          "cannot delete roles currently in use"
        );
      if (hasNotFound)
        throw new ResponsError(Code.NOT_FOUND, "roles not found");
    }

    let description = "bulk delete completed";
    if (hasForbidden || hasConflict) {
      description =
        "bulk delete completed but some roles cant be deleted";
    } else if (hasNotFound) {
      description =
        "bulk delete completed but some roles not found";
    }

    return {
      userId: actorId,
      result: {
        deleted: deletedCount,
        skipped: skipped.map((s) => s.id),
        message: description,
      },
      statusCode: Code.OK,
      beforeData: { roleIds },
      afterData: {
        deleted: deletedCount,
        skipped: skipped.map((s) => s.id),
      },
      description,
    };
  }
);