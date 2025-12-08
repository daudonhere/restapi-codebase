import { Request, Response, NextFunction } from "express";
import { findAllUsersService, findUserByIdService } from "../services/user-read";
import { sanitizeUser, sanitizeCredential } from "../../../utils/sanitize";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";

export const findAllUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const { users, meta } = await findAllUsersService(page, limit);
    const sanitizedUsers = users.map(user => sanitizeUser(user));
    return ResponsSuccess(res, Code.OK, "users retrieved successfully", { users: sanitizedUsers, meta });
  } catch (err) {
    next(err);
  }
};

export const findUserByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const user = await findUserByIdService(id);
    return ResponsSuccess(res, Code.OK, "user retrieved successfully", sanitizeCredential(user));
  } catch (err) {
    next(err);
  }
};