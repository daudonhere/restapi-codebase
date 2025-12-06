import { Request, Response, NextFunction } from "express";
import { ActivityContextInterface } from "../interfaces/activity-interface";
import { UAParser } from "ua-parser-js";

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
  const uaString = req.headers["user-agent"] || "";
  const parser = new UAParser(uaString);
  const deviceInfo = parser.getResult();

  const ip =
    req.headers["x-forwarded-for"]?.toString().split(",")[0].trim() ||
    req.ip ||
    req.socket.remoteAddress ||
    null;

  const context: ActivityContextInterface = {
    endpoint: req.originalUrl || req.url,
    method: req.method,
    ip,
    userAgent: uaString,
    device: {
      browser: deviceInfo.browser?.name || null,
      browserVersion: deviceInfo.browser?.version || null,
      os: deviceInfo.os?.name || null,
      osVersion: deviceInfo.os?.version || null,
      deviceModel: deviceInfo.device?.model || null,
      deviceType: deviceInfo.device?.type || "desktop",
      engine: deviceInfo.engine?.name || null,
    }
  };

  req.activityContext = context;
  next();
};