import { Request, Response, NextFunction } from "express";
import {
  createUserService,
  sendVerificationCodeService,
  confirmVerificationCodeService,
  restoreUserByIdService,
} from "../services/user-create";
import { findUserByIdService } from "../services/user-read";
import { Code } from "../../../constants/message-code";
import { ResponsSuccess } from "../../../constants/respons-success";
import { AuthenticatedRequest } from "../../../middlewares/authenticate";
import { sanitizeLogin, sanitizeUser } from "../../../utils/sanitize";
import { toMs } from "../../auth/controllers/token-manage";

const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

export const sendVerificationCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const context = req.activityContext!;
    const data = await sendVerificationCodeService(context, req.body);
    return ResponsSuccess(res, Code.OK, "verification code sent", data);
  } catch (err) {
    next(err);
  }
};

export const confirmVerificationCodeController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const context = req.activityContext!;
    const data = await confirmVerificationCodeService(context, req.body);

    const { accessToken, refreshToken, user } = data;

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/v1/auth/refresh",
      maxAge: toMs(REFRESH_TOKEN_EXPIRES_IN),
    });

    return ResponsSuccess(res, Code.OK, "email verified successfully", {
      accessToken,
      user: sanitizeLogin(user),
    });
  } catch (err) {
    next(err);
  }
};

export const createUserController = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const context = req.activityContext!;
    const data = await createUserService(context, req.body);

    return ResponsSuccess(res, Code.CREATED, "user created successfully", {
      id: data.user.id,
      fullname: data.user.fullname,
      email: data.user.email,
      source: data.user.source,
      emailSent: data.emailSent,
      phrase: data.user.phrase,
    });
  } catch (err) {
    next(err);
  }
};

export const restoreUserByIdController = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const actor = await findUserByIdService(req.user!.id);
    const context = req.activityContext!;
    const restored = await restoreUserByIdService(context, req.params.id, actor);
    return ResponsSuccess(res, Code.OK, "user restored successfully", sanitizeUser(restored));
  } catch (err) {
    next(err);
  }
};
