import { Request, Response, NextFunction } from "express";
import {
  findDeletedUsersService,
  deleteBulkUsersService,
  deleteUserByIdService,
} from "../services/user-delete";
import { findUserByIdService } from "../services/user-read";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { sanitizeUser } from "../../../utils/sanitize";

export const findDeletedUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { users, meta } = await findDeletedUsersService(page, limit);
    return ResponsSuccess(res, Code.OK, "deleted users retrieved", {
      users: users.map(user => sanitizeUser(user)),
      meta,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteBulkUsersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = await findUserByIdService(req.user!.id);
    const context = req.activityContext!;
    const data = await deleteBulkUsersService(context, req.body.ids, actor);

    return ResponsSuccess(res, Code.OK, data.message, {
      deleted: data.deleted,
      skipped: data.skipped,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteUserByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = await findUserByIdService(req.user!.id);
    const context = req.activityContext!;
    await deleteUserByIdService(context, req.params.id, actor);
    return ResponsSuccess(res, Code.OK, "user deleted successfully", null);
  } catch (err) {
    next(err);
  }
};
