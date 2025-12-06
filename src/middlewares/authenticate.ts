import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import dotenv from "dotenv";
import { PayloadInterface } from "../interfaces/payload-interface";
import { ResponsError } from "../constants/respons-error";
import { Code } from "../constants/message-code";

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: PayloadInterface;
}

export const authenticateToken = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers["authorization"];

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new ResponsError(Code.UNAUTHORIZED, "authorization header missing or invalid");
    }

    const token = authHeader.split(" ")[1];

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "JWT secret not configured");
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    if (!decoded || !decoded.id || !decoded.email || !decoded.roles) {
      throw new ResponsError(Code.UNAUTHORIZED, "malformed token payload");
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
      roles: decoded.roles,
    };

    next();

  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new ResponsError(Code.UNAUTHORIZED, "token has expired");
    }
    if (err instanceof Error) {
      throw new ResponsError(Code.UNAUTHORIZED, err.message);
    }
    throw new ResponsError(Code.UNAUTHORIZED, "token verification failed");
  }
};