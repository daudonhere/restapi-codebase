import jwt, { SignOptions } from "jsonwebtoken";
import dotenv from "dotenv";
import { saveTokenModel } from "../models/token-create";
import { deleteTokenModel, deleteTokenByUserAndTypeModel } from "../models/token-delete";
import { Payload } from "../schema/auth-schema";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "default_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || "default_refresh_secret";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const generateAccessToken = (payload: Payload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"] });
};

export const generateRefreshToken = (payload: { id: string }): string => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN as SignOptions["expiresIn"] });
};

export const verifyAccessToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};

export const decodeRefreshToken = (token: string): { id: string } => {
  return jwt.verify(token, REFRESH_SECRET) as { id: string };
};

export const getRefreshExpiresAt = (toMs: (v: string) => number): Date => {
  return new Date(Date.now() + toMs(REFRESH_TOKEN_EXPIRES_IN));
};

export const toMs = (value: string): number => {
  const match = value.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const amount = parseInt(match[1], 10);
  const unit = match[2];
  if (unit === "s") return amount * 1000;
  if (unit === "m") return amount * 60 * 1000;
  if (unit === "h") return amount * 60 * 60 * 1000;
  if (unit === "d") return amount * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
};

export const saveRefreshToken = async (
  userId: string,
  token: string,
  expiresAt: Date
) => {
  await deleteTokenByUserAndTypeModel(userId, "refresh");
  await saveTokenModel(userId, token, "refresh", expiresAt);
};

export const revokeRefreshToken = async (token: string): Promise<void> => {
  await deleteTokenModel(token, "refresh");
};

export const revokeTokenByUserAndType = async (userId: string, type: "refresh" | "verify" | "reset"): Promise<void> => {
  await deleteTokenByUserAndTypeModel(userId, type);
};
