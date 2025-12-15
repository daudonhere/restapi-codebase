import { Response, NextFunction } from "express";
import { createRoleService } from "../services/role-create";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { RoleCreateBodySchema } from "../schema/role-schema";

export const createRoleController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const body = RoleCreateBodySchema.parse(req.body);

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const actorId = req.user!.id;

    const data = await createRoleService(
      context,
      body.name,
      body.description,
      Boolean(body.is_system),
      actorId
    );

    return ResponsSuccess(
      res,
      Code.OK,
      "role created successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};
