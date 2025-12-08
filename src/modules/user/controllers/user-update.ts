import { Response, NextFunction } from "express";
import { findUserByIdService } from "../services/user-read";
import { updateUserByIdService, updateUserRolesService } from "../services/user-update";
import { Code } from "../../../constants/message-code";
import { ResponsError } from "../../../constants/respons-error";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { sanitizeUser } from "../../../utils/sanitize";
import { uploadAvatarService } from "../services/user-update";
import { updateUserCredentialService } from "../services/user-update";

export const uploadAvatarController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = req.user!;
    const context = req.activityContext;
    const file = req.file;

    if (!context) throw new Error("activity context missing");

    const data = await uploadAvatarService(context, actor.id, file);

    return ResponsSuccess(res, Code.OK, "avatar updated", data.result);
  } catch (err) {
    next(err);
  }
};

export const updateUserCredentialController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = req.user!;
    const context = req.activityContext;

    if (!context) throw new Error("activity context missing");

    const updated = await updateUserCredentialService(context, actor.id, req.body, actor);

    return ResponsSuccess(res, Code.OK, "credential updated successfully", updated);
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
    const actor = req.user!;
    const context = req.activityContext;

    if (!context) throw new Error("activity context missing");

    const { fullname, phone, email, passphrase } = req.body;

    if (!passphrase || typeof passphrase !== "string") {
      throw new ResponsError(Code.BAD_REQUEST, "passphrase required");
    }

    const fields = { fullname, phone, email };

    const data = await updateUserByIdService(
      context,
      actor.id,
      fields,
      actor,
      passphrase.trim()
    );

    return ResponsSuccess(
      res,
      Code.OK,
      "user updated successfully",
      data 
    );

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