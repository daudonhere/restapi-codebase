import { Response, NextFunction } from "express";
import { createRoleService } from "../services/role-create";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";

export const createRoleController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description, is_system } = req.body;
    const context = req.activityContext; 
    if (!context) throw new Error("activity context missing");
    const actorId = req.user?.id;
    const data = await createRoleService(
      context,
      name,
      description,
      Boolean(is_system),
      actorId
    );
    return ResponsSuccess(res, Code.OK, "role created successfully", data);
  } catch (err) {
    next(err);
  }
};