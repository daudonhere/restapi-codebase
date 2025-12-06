import { Request, Response, NextFunction } from "express";
import { processGithubLoginService } from "../services/token-github";
import { sanitizeLogin } from "../../../utils/sanitize";
import { ResponsSuccess } from "../../../constants/respons-success";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";

export const githubCallbackController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      throw new ResponsError(
        Code.BAD_REQUEST,
        `gitHub OAuth error, ${error_description || error}`
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

    const data = await processGithubLoginService(context, code);

    const sanitizedUser = sanitizeLogin(data.user);

    return ResponsSuccess(res, Code.OK, "login github successful", {
      ...data,
      user: sanitizedUser,
    });
  } catch (err) {
    next(err);
  }
};
