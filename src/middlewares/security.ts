import helmet from "helmet";
import { Request, Response, NextFunction } from "express";

export const securityMiddleware = () => {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    xssFilter: true,
    hidePoweredBy: true,
  });
};