import { Request, Response, NextFunction } from "express";
import {
  getAllRolesService,
  getRoleByIdService,
} from "../services/role-read";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { RoleIdParamSchema } from "../schema/role-schema";

export const getAllRolesController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page as string;
    const limit = req.query.limit as string;

    const { roles, meta } = await getAllRolesService(page, limit);

    return ResponsSuccess(
      res,
      Code.OK,
      "roles retrieved successfully",
      { roles, meta }
    );
  } catch (err) {
    next(err);
  }
};

export const getRoleByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = RoleIdParamSchema.parse(req.params);

    const data = await getRoleByIdService(id);

    return ResponsSuccess(
      res,
      Code.OK,
      "roles retrieved successfully",
      data
    );
  } catch (err) {
    next(err);
  }
};
