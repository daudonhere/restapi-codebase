import { Request, Response, NextFunction } from "express";
import {
  findAllUsersService,
  findUserByIdService,
} from "../services/user-read";
import { sanitizeUser, sanitizeCredential } from "../../../utils/sanitize";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";

export const findAllUsersController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    const { users, meta } = await findAllUsersService(page, limit);
    return ResponsSuccess(res, Code.OK, "users retrieved successfully", {
      users: users.map(user => sanitizeUser(user)),
      meta,
    });
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
    const user = await findUserByIdService(req.params.id);
    return ResponsSuccess(
      res,
      Code.OK,
      "user retrieved successfully",
      sanitizeCredential(user)
    );
  } catch (err) {
    next(err);
  }
};
