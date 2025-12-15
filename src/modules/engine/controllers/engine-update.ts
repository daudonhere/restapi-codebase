import { Response, NextFunction } from "express";
import { toggleModuleService } from "../services/engine-update";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { EngineModuleNameSchema } from "../schema/engine-schema";

export const toggleModuleController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name } = EngineModuleNameSchema.parse(req.params);

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const actorId = req.user?.id ?? null;

    const updated = await toggleModuleService(
      context,
      name,
      actorId
    );

    return ResponsSuccess(
      res,
      Code.OK,
      `module ${updated.name} is now ${
        updated.installed ? "installed" : "uninstalled"
      }`,
      updated
    );
  } catch (err) {
    next(err);
  }
};