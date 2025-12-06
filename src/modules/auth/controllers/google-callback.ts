import { Request, Response, NextFunction } from "express";
import { handleGoogleLoginService } from "../services/token-google";
import { sanitizeLogin } from "../../../utils/sanitize";
import { ResponsSuccess } from "../../../constants/respons-success";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";

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
        `google OAuth error, ${error_description || error}`
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
    const sanitizedUser = sanitizeLogin(data.user);

    return ResponsSuccess(res, Code.OK, "login google successful", {
      ...data,
      user: sanitizedUser,
    });
  } catch (err) {
    next(err);
  }
};
