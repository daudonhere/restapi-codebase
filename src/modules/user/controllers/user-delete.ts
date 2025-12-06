import { Request, Response, NextFunction } from "express";
import { findUserByIdService } from "../services/user-read";
import { findDeletedUsersService, deleteBulkUsersService, deleteUserByIdService } from "../services/user-delete";
import { Code } from "../../../constants/message-code";
import { ResponsError } from "../../../constants/respons-error";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { sanitizeUser } from "../../../utils/sanitize";

export const deleteBulkUsersController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { ids } = req.body;
    const actor = await findUserByIdService(req.user!.id);
    if (!actor) throw new ResponsError(Code.UNAUTHORIZED, "Action requires valid user");

    const context = req.activityContext!;

    const data = await deleteBulkUsersService(context, ids, actor);
    
    return ResponsSuccess(
      res, 
      Code.OK, 
      data.message, 
      { 
        deleted: data.deleted, 
        skipped: data.skipped 
      }
    );
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
    const { id } = req.params;
    const actorPayload = req.user!;
    const actor = await findUserByIdService(actorPayload.id);
    if (!actor) throw new ResponsError(Code.UNAUTHORIZED, "Action requires valid user");

    const context = req.activityContext!;

    await deleteUserByIdService(context, id, actor);
    return ResponsSuccess(res, Code.OK, "user deleted successfully", null);
  } catch (err) {
    next(err);
  }
};

export const findDeletedUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { users, meta } = await findDeletedUsersService(page, limit);

    if (meta.totalData === 0) {
      return ResponsSuccess(res, Code.OK, "deleted users retrieved", null);
    }
    
    const sanitizedUsers = users.map(user => sanitizeUser(user));
    return ResponsSuccess(res, Code.OK, "deleted users retrieved", { users: sanitizedUsers, meta });
  } catch (err) {
    next(err);
  }
};