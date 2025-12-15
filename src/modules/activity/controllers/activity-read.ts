import { Request, Response, NextFunction } from "express";
import {
  getActivityLogService,
  getActivityLogByIdService,
} from "../services/activity-read";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { sanitizeLog } from "../../../utils/sanitize";
import {
  ActivityQuerySchema,
  ActivityIdParamSchema,
} from "../schema/activity-schema";

export const getAllActivityLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const parsed = ActivityQuerySchema.parse(req.query);
    const { page, limit, ...filters } = parsed;

    const { logs, meta } = await getActivityLogService(
      page,
      limit,
      filters
    );

    const sanitizedLogs = logs.map((log) => sanitizeLog(log));

    return ResponsSuccess(
      res,
      Code.OK,
      "activity logs retrieved successfully",
      { logs: sanitizedLogs, meta }
    );
  } catch (err) {
    next(err);
  }
};

export const getActivityLogByIdController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = ActivityIdParamSchema.parse(req.params);

    const log = await getActivityLogByIdService(id);

    return ResponsSuccess(
      res,
      Code.OK,
      "activity logs retrieved successfully",
      log
    );
  } catch (err) {
    next(err);
  }
};
