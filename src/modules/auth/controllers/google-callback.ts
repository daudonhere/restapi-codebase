import { Request, Response, NextFunction } from "express";
import { handleGoogleLoginService } from "../services/token-google";
import { sanitizeLogin } from "../../../utils/sanitize";
import { ResponsSuccess } from "../../../constants/respons-success";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { toMs } from "../controllers/token-manage";

const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const googleCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { code, error, error_description } = req.query;

    if (error) {
      throw new ResponsError(
        Code.BAD_REQUEST,
        `Google OAuth error: ${error_description || error}`
      );
    }

    if (!code || typeof code !== "string") {
      throw new ResponsError(
        Code.BAD_REQUEST,
        "authorization code not provided or invalid"
      );
    }

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const data = await handleGoogleLoginService(context, code);

    const { accessToken, refreshToken, user } = data;

    const sanitizedUser = sanitizeLogin(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/v1/auth/refresh",
      maxAge: toMs(REFRESH_TOKEN_EXPIRES_IN),
    });

    return ResponsSuccess(res, Code.OK, "login google successful", {
      accessToken,
      user: sanitizedUser,
    });

  } catch (err) {
    next(err);
  }
};