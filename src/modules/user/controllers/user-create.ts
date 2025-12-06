import { Request, Response, NextFunction } from "express";
import { createUserService, sendVerificationCodeService, confirmVerificationCodeService, restoreUserByIdService } from "../services/user-create";
import { findUserByIdService } from "../services/user-read";
import { Code } from "../../../constants/message-code";
import { ResponsError } from "../../../constants/respons-error";
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
    const { email } = req.body;

    if (!email) {
      throw new ResponsError(Code.BAD_REQUEST, "email is required");
    }

    const context = req.activityContext; 
    if (!context) throw new Error("activity context missing");

    const data = await sendVerificationCodeService(context, email);
    return ResponsSuccess(res, Code.OK, data.emailSent ? "verification code sent" : "failed to send verification code", data);
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
    const { email, code } = req.body;

    if (!email || !code) {
      throw new ResponsError(Code.BAD_REQUEST, "email and code are required");
    }

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const data = await confirmVerificationCodeService(context, email, code);

    const { accessToken, refreshToken, user } = data;

    const sanitizedUser = sanitizeLogin(user);

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/v1/auth/refresh",
      maxAge: toMs(REFRESH_TOKEN_EXPIRES_IN),
    });

    return ResponsSuccess(res, Code.OK, "email verified successfully", {
      accessToken,
      user: sanitizedUser,
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
    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");

    const { user, emailSent } = await createUserService(context, req.body);
    
    const description = emailSent
      ? "user created successfully and verification email sent"
      : "user created successfully";

    return ResponsSuccess(
      res, 
      Code.OK, 
      description,
      { id: user.id,
        fullname: user.fullname,
        email: user.email,
        source: user.source,
        emailSent
      },
    );
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
    const { id } = req.params;
    const actorPayload = req.user!;
    const actor = await findUserByIdService(actorPayload.id);
    
    if(!actor) throw new ResponsError(Code.UNAUTHORIZED, "actor not found");

    const context = req.activityContext;
    if (!context) throw new Error("activity context missing");
    const restored = await restoreUserByIdService(context, id, actor);
    return ResponsSuccess(res, Code.OK, "user restored successfully", sanitizeUser(restored));
  } catch (err) {
    next(err);
  }
};