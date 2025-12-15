import { Request, Response, NextFunction } from "express";
import { getAllModulesService } from "../services/engine-read";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";

export const getAllModulesController = async (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const modules = await getAllModulesService();

    return ResponsSuccess(
      res,
      Code.OK,
      "modules retrieved successfully",
      modules
    );
  } catch (err) {
    next(err);
  }
};
