import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import {
  softDeleteUserModel,
  hardDeleteUserModel,
  countDeletedUsersModel,
  findDeletedUsersModel,
} from "../models/user-delete";
import { findUserByIdModel } from "../models/user-read";
import { getPagination, buildMeta } from "../../../utils/pagination";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { User } from "../schema/user-schema";

export const findDeletedUsersService = async (
  page: number,
  limit: number
) => {
  const totalData = await countDeletedUsersModel();
  const { offset } = getPagination(page, limit);
  const users = await findDeletedUsersModel(limit, offset);
  return { users, meta: buildMeta(page, limit, totalData) };
};

export const deleteUserByIdService = withActivityLog(
  { module: "user", action: "delete user" },
  async (_context, userId: string, actor: User) => {
    if (actor.id === userId) {
      throw new ResponsError(Code.FORBIDDEN, "cannot delete self");
    }

    const user = await findUserByIdModel(userId);
    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    if (user.roles.includes("superadmin")) {
      throw new ResponsError(Code.FORBIDDEN, "cannot delete superadmin");
    }

    await softDeleteUserModel(userId);

    return {
      userId: actor.id,
      statusCode: Code.OK,
      result: null,
      description: `user ${userId} deleted`,
    };
  }
);

export const deleteBulkUsersService = withActivityLog(
  { module: "user", action: "bulk delete user" },
  async (_context, ids: string[], actor: User) => {
    if (
      !actor.roles.includes("superadmin") &&
      !actor.roles.includes("administrator")
    ) {
      throw new ResponsError(Code.FORBIDDEN, "no permission");
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      throw new ResponsError(Code.BAD_REQUEST, "ids must be non-empty array");
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

      let allowed = false;

      if (actorIsSuper) {
        if (!targetIsSuper) allowed = true;
      } else {
        if (!targetIsSuper && !targetIsAdmin) allowed = true;
      }

      if (!allowed) {
        skipped.push(id);
        hasForbidden = true;
        continue;
      }

      await softDeleteUserModel(id);
      deleted++;
    }

    if (deleted === 0 && hasForbidden) {
      throw new ResponsError(
        Code.FORBIDDEN,
        "forbidden: cannot delete self or higher role"
      );
    }

    if (deleted === 0 && hasNotFound) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    let description = "bulk delete completed";
    if (hasForbidden) {
      description = "bulk delete completed but some users cannot be deleted";
    } else if (hasNotFound) {
      description = "bulk delete completed but some users not found";
    }

    return {
      userId: actor.id,
      statusCode: Code.OK,
      result: {
        deleted,
        skipped,
        message: description,
      },
      description,
    };
  }
);

export const hardDeleteUserService = withActivityLog(
  { module: "user", action: "destroy user" },
  async (_context, userId: string) => {
    await hardDeleteUserModel(userId);

    return {
      userId: null,
      statusCode: Code.OK,
      result: null,
      description: "user permanently deleted",
    };
  }
);
