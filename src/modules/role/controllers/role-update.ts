import { Response, NextFunction } from "express";
import { updateRoleService } from "../services/role-update";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";

export const updateRoleController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, description } = req.body;
    const { id } = req.params;
    const context = req.activityContext; 
    if (!context) throw new Error("activity context missing");
    const actorId = req.user!.id;

    const data = await updateRoleService(
      context,
      id,
      name,
      description,
      actorId
    );
    return ResponsSuccess(res, Code.OK, "role updated successfully", data);
  } catch (err) {
    next(err);
  }
};