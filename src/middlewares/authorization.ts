import { Response, NextFunction } from "express";
import dotenv from "dotenv";
import { ResponsError } from "../constants/respons-error";
import { Code } from "../constants/message-code";
import { AuthenticatedRequest } from "./authenticate";

dotenv.config();

export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      throw new ResponsError(Code.UNAUTHORIZED, "authentication required");
    }

    if (allowedRoles.length === 0) {
      return next();
    }

    const hasAccess = user.roles?.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      throw new ResponsError(
        Code.FORBIDDEN,
        `access denied, requires roles ${allowedRoles.join(" or ")}`
      );
    }
    next();
  };
};
