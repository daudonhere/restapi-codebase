import { Request, Response, NextFunction } from "express";
import { loginUserService } from "../services/token-create";
import { sanitizeLogin } from "../../../utils/sanitize";
import { ResponsSuccess } from "../../../constants/respons-success";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";

export const loginController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      throw new ResponsError(Code.BAD_REQUEST, "missing required fields");
    }

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const data = await loginUserService(context, email, password)

    const sanitizedUser = sanitizeLogin(data.user);

    return ResponsSuccess(res, Code.OK, "login successful", {
      ...data,
      user: sanitizedUser,
    });
  } catch (err) {
    next(err);
  }
};