import { Request, Response, NextFunction } from "express";
import { ActivityContextInterface } from "../interfaces/activity-interface";

declare global {
  namespace Express {
    interface Request {
      activityContext?: ActivityContextInterface;
    }
  }
}

export const activityContextMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const context: ActivityContextInterface = {
    endpoint: req.originalUrl || req.url,
    method: req.method,
    ip: req.headers["x-forwarded-for"]?.toString() || req.socket.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
  };
  req.activityContext = context;
  next();
};