import { Response, NextFunction } from "express";
import {
  uploadAvatarService,
  updateUserCredentialService,
  updateUserByIdService,
  updateUserRolesService,
} from "../services/user-update";
import { findUserByIdService } from "../services/user-read";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { sanitizeUser } from "../../../utils/sanitize";

export const uploadAvatarController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const context = req.activityContext!;
    const data = await uploadAvatarService(context, req.user!.id, req.file!);
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
    const context = req.activityContext!;
    const data = await updateUserCredentialService(
      context,
      req.user!.id,
      req.body,
      req.user!
    );
    return ResponsSuccess(res, Code.OK, "credential updated successfully", data);
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
    const context = req.activityContext!;
    const data = await updateUserByIdService(
      context,
      req.user!.id,
      req.body,
      req.user!,
      req.body.passphrase
    );
    return ResponsSuccess(res, Code.OK, "user updated successfully", data);
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
    const actor = await findUserByIdService(req.user!.id);
    const context = req.activityContext!;
    const updated = await updateUserRolesService(
      context,
      req.params.id,
      req.body,
      actor
    );
    return ResponsSuccess(
      res,
      Code.OK,
      "user roles updated successfully",
      sanitizeUser(updated)
    );
  } catch (err) {
    next(err);
  }
};
