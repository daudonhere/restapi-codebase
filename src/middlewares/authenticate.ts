import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, TokenExpiredError } from "jsonwebtoken";
import dotenv from "dotenv";
import { ResponsError } from "../constants/respons-error";
import { Code } from "../constants/message-code";
import { Payload, PayloadSchema } from "../modules/auth/schema/auth-schema";

dotenv.config();

export interface AuthenticatedRequest extends Request {
  user?: Payload;
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

    // Validate the payload structure using Zod schema
    req.user = PayloadSchema.parse(decoded);

    next();

  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new ResponsError(Code.UNAUTHORIZED, "token has expired");
    }
    if (err instanceof Error) {
      // Catch Zod validation errors as well
      throw new ResponsError(Code.UNAUTHORIZED, `token verification failed: ${err.message}`);
    }
    throw new ResponsError(Code.UNAUTHORIZED, "token verification failed");
  }
};