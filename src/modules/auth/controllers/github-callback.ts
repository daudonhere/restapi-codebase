import { Request, Response, NextFunction } from "express";
import { processGithubLoginService } from "../services/token-github";
import { sanitizeLogin } from "../../../utils/sanitize";
import { ResponsSuccess } from "../../../constants/respons-success";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { toMs } from "../controllers/token-manage";
import { OAuthCallbackSchema } from "../schema/auth-schema";

const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const githubCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const query = OAuthCallbackSchema.parse(req.query);
    if (query.error) {
      throw new ResponsError(
        Code.BAD_REQUEST,
        `GitHub OAuth error: ${query.error_description || query.error}`
      );
    }

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const data = await processGithubLoginService(context, query.code);

    const { accessToken, refreshToken, user } = data;

    const sanitizedUser = sanitizeLogin(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/v1/auth/refresh",
      maxAge: toMs(REFRESH_TOKEN_EXPIRES_IN),
    });

    return ResponsSuccess(res, Code.OK, "login github successful", {
      accessToken,
      user: sanitizedUser
    });

  } catch (err) {
    next(err);
  }
};
