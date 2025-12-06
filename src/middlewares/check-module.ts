import { Response, NextFunction } from "express";
import { ResponsError } from "../constants/respons-error";
import { Code } from "../constants/message-code";
import { findModuleByNameModel } from "../modules/engine/models/engine-read";
import { AuthenticatedRequest } from "./authenticate";

export const checkModuleEnabled = (moduleName: string) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const user = req.user;
      if (user && user.roles?.includes("superadmin")) {
        return next();
      }

      const module = await findModuleByNameModel(moduleName);

      if (!module) {
        throw new ResponsError(
          Code.NOT_FOUND,
          `module '${moduleName}' is not registered in engine registry`
        );
      }

      if (!module.installed) {
        throw new ResponsError(
          Code.FORBIDDEN,
          `module '${moduleName}' not installed or under construction`
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
