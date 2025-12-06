import { Request, Response } from "express";
import { getGoogleAuthURLService } from "../services/token-google";

export const googleAuthRedirectController = (
  _req: Request,
  res: Response
): void => {
  const url = getGoogleAuthURLService();
  res.redirect(url);
};