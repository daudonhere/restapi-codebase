import { Request, Response, NextFunction } from "express";
import { refreshAccessTokenService } from "../services/token-manage";
import { ResponsSuccess } from "../../../constants/respons-success";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";

export const refreshController = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<Response | void> => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      throw new ResponsError(
        Code.UNAUTHORIZED,
        "refresh token is required."
      );
    }

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const data = await refreshAccessTokenService(context, refreshToken);
    return ResponsSuccess(res, Code.OK, "access token refreshed", data);
  } catch (err) {
    next(err);
  }
};