import { Response, NextFunction } from "express";
import { deleteRoleService, deleteBulkRolesService } from "../services/role-delete";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";

export const deleteRoleController = async (
  req: AuthenticatedRequest & { params: { id: string } },
  res: Response,
  next: NextFunction
) => {
  try {
    const context = req.activityContext!;
    const actorId = req.user!.id;
    await deleteRoleService(context, req.params.id, actorId);
    return ResponsSuccess(res, Code.OK, "role successfully deleted", null);
  } catch (err) {
    next(err);
  }
};

export const deleteBulkRolesController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { roleIds } = req.body;
    const context = req.activityContext!;
    const actorId = req.user!.id;
    
    const data = await deleteBulkRolesService(
      context,
      roleIds,
      actorId
    );

    return ResponsSuccess(
      res, 
      Code.OK, 
      data.message, 
      {
        deleted: data.deleted,
        skipped: data.skipped
      }
    );
  } catch (err) {
    next(err);
  }
};