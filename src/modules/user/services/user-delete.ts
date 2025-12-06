import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { UserInterface } from "../../../interfaces/user-interface";
import { findUserByIdModel } from "../models/user-read";
import { softDeleteUserModel, hardDeleteUserModel, countDeletedUsersModel, findDeletedUsersModel } from "../models/user-delete";
import { getPagination, buildMeta } from "../../../utils/pagination";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

export const findDeletedUsersService = async (page: number, limit: number) => {
  const totalData = await countDeletedUsersModel();
  const { offset } = getPagination(page, limit);
  const users = await findDeletedUsersModel(limit, offset);
  return { users, meta: buildMeta(page, limit, totalData) };
};

export const deleteBulkUsersService = withActivityLog(
  { module: "user", action: "bulk delete user" },
  async (context, ids: string[], actor: UserInterface) => {
    if (
      !actor.roles.includes("superadmin") &&
      !actor.roles.includes("administrator")
    ) {
      throw new ResponsError(Code.FORBIDDEN, "no permission");
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ResponsError(Code.BAD_REQUEST, "ids must be array");
    }

    let deleted = 0;
    const skipped: string[] = [];
    
    let hasForbidden = false;
    let hasNotFound = false;

    for (const id of ids) {
      if (id === actor.id) {
        skipped.push(id);
        hasForbidden = true;
        continue;
      }

      const target = await findUserByIdModel(id);

      if (!target) {
        skipped.push(id);
        hasNotFound = true;
        continue;
      }

      const actorIsSuper = actor.roles.includes("superadmin");
      const targetIsSuper = target.roles.includes("superadmin");
      const targetIsAdmin = target.roles.includes("administrator");

      let isAllowed = false;

      if (actorIsSuper) {
        if (!targetIsSuper) {
          isAllowed = true;
        }
      } else {
        if (!targetIsSuper && !targetIsAdmin) {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        skipped.push(id);
        hasForbidden = true;
        continue;
      }

      await softDeleteUserModel(id);
      deleted++;
    }

    if (deleted === 0 && hasForbidden) {
      throw new ResponsError(Code.FORBIDDEN, "forbidden: cannot delete self or higher role");
    }

    if (deleted === 0 && hasNotFound) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    let description = "bulk delete completed";
    
    if (hasForbidden) {
      description = "bulk delete completed but some user cant be deleted";
    } else if (hasNotFound) {
      description = "bulk delete completed but some user not found";
    }

    const resultPayload = {
      deleted,
      skipped,
      message: description
    };

    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData: { ids },
      afterData: { deleted, skipped },
      result: resultPayload,
      description: description
    };
  }
);

export const deleteUserByIdService = withActivityLog(
  { module: "user", action: "delete user" },
  async (context, idToDelete: string, actor: UserInterface) => {
    if (actor.id === idToDelete)
      throw new ResponsError(Code.FORBIDDEN, "cannot delete self");
    const user = await findUserByIdModel(idToDelete);
    if (!user) throw new ResponsError(Code.NOT_FOUND, "not found");

    if (user.roles.includes("superadmin"))
      throw new ResponsError(Code.FORBIDDEN, "cannot delete superadmin");
    const beforeData = {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      roles: user.roles
    };
    await softDeleteUserModel(idToDelete);

    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData,
      afterData: { deleted: true },
      result: null,
      description: `user ${idToDelete} deleted`
    };
  }
);

export const hardDeleteUserService = withActivityLog(
  { module: "user", action: "destroy user" },
  async (context, id: string) => {
    const deleted = await hardDeleteUserModel(id);
    return {
      userId: null,
      statusCode: Code.OK,
      beforeData: deleted ? { id: deleted.id, email: deleted.email } : { id },
      afterData: null,
      result: null,
      description: "user permanently deleted"
    };
  }
);