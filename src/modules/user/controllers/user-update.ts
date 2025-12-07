import { Response, NextFunction } from "express";
import { findUserByIdService } from "../services/user-read";
import { updateUserByIdService, updateUserRolesService } from "../services/user-update";
import { Code } from "../../../constants/message-code";
import { ResponsError } from "../../../constants/respons-error";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { sanitizeUser } from "../../../utils/sanitize";
import { uploadAvatarService } from "../services/user-update";

export const uploadAvatarController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const actorPayload = req.user!;
    
    const actor = await findUserByIdService(actorPayload.id);
    if (!actor) throw new ResponsError(Code.UNAUTHORIZED, "action requires valid user");

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");
    const file = req.file;

    const data = await uploadAvatarService(context, id, file);

    return ResponsSuccess(res, Code.OK, "avatar updated", data.result);
  } catch (err) {
    next(err);
  }
};

export const updateUserByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const actorPayload = req.user!;
    
    const actor = await findUserByIdService(actorPayload.id);
    if (!actor) throw new ResponsError(Code.UNAUTHORIZED, "action requires valid user");

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const updatedUser = await updateUserByIdService(context, id, req.body, actor);
    
    return ResponsSuccess(res, Code.OK, "users updated successfully", sanitizeUser(updatedUser));
  } catch (err) {
    next(err);
  }
};

export const updateUserRolesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { roles } = req.body; 
    const actor = await findUserByIdService(req.user!.id);
    if (!actor) throw new ResponsError(Code.UNAUTHORIZED, "action requires valid user");

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");
    const updated = await updateUserRolesService(context, id, roles, actor);
    
    return ResponsSuccess(res, Code.OK, "users role updated successfully", sanitizeUser(updated));
  } catch (err) {
    next(err);
  }
};