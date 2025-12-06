import { Request, Response, NextFunction } from "express";
import { getActivityLogService, getActivityLogByIdService } from "../services/activity-read";
import { ResponsSuccess } from "../../../constants/respons-success";
import { Code } from "../../../constants/message-code";
import { sanitizeLog } from "../../../utils/sanitize";

export const getAllActivityLogController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = req.query.page as string;
    const limit = req.query.limit as string;
    const module = req.query.module as string | undefined;
    const action = req.query.action as string | undefined;
    const userId = req.query.userId as string | undefined;
    const status = req.query.status as string | undefined;
    const dateFrom = req.query.dateFrom as string | undefined;
    const dateTo = req.query.dateTo as string | undefined;

    const { logs, meta } = await getActivityLogService(page, limit, {
      module,
      action,
      userId,
      status,
      dateFrom,
      dateTo,
    });

    const sanitizedLogs = logs.map(log => sanitizeLog(log));

    return ResponsSuccess(res, Code.OK, "activity logs retrieved successfully", {
      logs: sanitizedLogs,
      meta,
    });
  } catch (err) {
    next(err);
  }
};

export const getActivityLogByIdController = async (
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const log = await getActivityLogByIdService(req.params.id);
    return ResponsSuccess(res, Code.OK, "activity logs retrieved successfully", log);
  } catch (err) {
    next(err);
  }
};
