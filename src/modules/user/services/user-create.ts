import bcrypt from "bcrypt";
import crypto from "crypto";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { UserInterface } from "../../../interfaces/user-interface";
import { sendVerificationEmail, isEmailOnAllowList } from "../../../utils/email";
import { findUserByEmailModel } from "../models/user-read";
import { createUserModel, setUserAsVerifiedModel, restoreUserByIdModel } from "../models/user-create";
import { updateLastLoginModel } from "../models/user-update";
import { deleteTokenByUserAndTypeModel } from "../../auth/models/token-delete";
import { saveTokenModel } from "../../auth/models/token-create";
import { findTokenModel } from "../../auth/models/token-read";
import { deleteTokenModel } from "../../auth/models/token-delete";
import { 
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiresAt,
  saveRefreshToken,
  toMs 
} from "../../auth/controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { generatePhrase } from "../../../utils/phrase";

export const generateVerificationCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

export const sendVerificationCodeService = withActivityLog(
  { module: "user", action: "send verification code" },
  async (context, email: string) => {
    const beforeData = { email };

    const user = await findUserByEmailModel(email);
    if (!user) throw new ResponsError(Code.NOT_FOUND, "user not found");
    if (user.is_verified)
      throw new ResponsError(Code.CONFLICT, "already verified");

    await deleteTokenByUserAndTypeModel(user.id, "verify");

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await saveTokenModel(user.id, code, "verify", expiresAt);

    sendVerificationEmail(email, code)
      .then(() => console.log(`email sent to ${email} in background`))
      .catch((err) => console.error(`failed to send email to ${email} cause `, err));

    return {
      userId: user.id,
      statusCode: Code.OK,
      beforeData,
      afterData: null,
      result: { emailSent: true },
      description: "verification code sending in background"
    };
  }
);

export const confirmVerificationCodeService = withActivityLog(
  { module: "user", action: "confirm verification code" },
  async (context, email: string, code: string) => {
    const beforeData = { email, code };
    const user = await findUserByEmailModel(email);
    if (!user) throw new ResponsError(Code.NOT_FOUND, "user not found");
    if (user.is_verified)
      throw new ResponsError(Code.CONFLICT, "already verified");
    
    const token = await findTokenModel(code, "verify");
    if (!token || token.user_id !== user.id)
      throw new ResponsError(Code.BAD_REQUEST, "invalid code");
    
    if (token.expired_at < new Date())
      throw new ResponsError(Code.BAD_REQUEST, "code expired");
    
    await setUserAsVerifiedModel(user.id);
    await deleteTokenModel(code, "verify");
    await updateLastLoginModel(user.id);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles
    });
    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt = getRefreshExpiresAt(toMs);

    await saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      userId: user.id,
      statusCode: Code.OK,
      beforeData,
      afterData: { verified: true },
      result: {
        accessToken,
        refreshToken,
        user
      },
      description: "email verified"
    };
  }
);

export const createUserService = withActivityLog(
  { module: "user", action: "create user" },
  async (context, data: any) => {
    const { email, password, fullname } = data;
    const beforeData = { email, fullname };

    if (!email || !password || !fullname)
      throw new ResponsError(Code.BAD_REQUEST, "missing fields");

    if (!isEmailOnAllowList(email))
      throw new ResponsError(Code.BAD_REQUEST, "email provider not allowed");

    const existing = await findUserByEmailModel(email, true);
    let createdPhrase: string | null = null;
    if (existing) {
      if (existing.is_delete) {
        throw new ResponsError(
          Code.FORBIDDEN,
          "user access revoked, contact your administrator or register with another way"
        );
      }

      if (existing.source !== "email")
        throw new ResponsError(
          Code.CONFLICT,
          `registered via ${existing.source}`
        );

      throw new ResponsError(Code.CONFLICT, "email already registered");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const phrase = generatePhrase();
    const hashedPhrase = await bcrypt.hash(phrase, 10);
    createdPhrase = phrase;

    const user = await createUserModel(
      email,
      hashedPassword,
      fullname,
      "email",
      context.ip,
      context.userAgent,
      hashedPhrase 
    );

    await deleteTokenByUserAndTypeModel(user.id, "verify");

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveTokenModel(user.id, code, "verify", expiresAt);

    sendVerificationEmail(email, code)
      .then(() => console.log(`email sent to ${email} in background`))
      .catch((err) =>
        console.error(`failed to send email to ${email} cause`, err)
      );

    const afterData = {
      id: user.id,
      email: user.email,
      fullname: user.fullname,
      source: user.source,
      is_verified: user.is_verified
    };

    return {
      userId: user.id,
      statusCode: Code.CREATED,
      beforeData,
      afterData,
      result: { 
        user: {
          ...user,
          phrase: createdPhrase
        },
        emailSent: true,
      },
      description: "user created, email sending in background"
    };
  }
);


export const restoreUserByIdService = withActivityLog(
  { module: "user", action: "restore user" },
  async (context, id: string, actor: UserInterface) => {
    const restored = await restoreUserByIdModel(id);
    if (!restored)
      throw new ResponsError(Code.NOT_FOUND, "user not found or not deleted");
    return {
      userId: actor.id,
      statusCode: Code.OK,
      beforeData: { id, deleted: true },
      afterData: {
        id: restored.id,
        email: restored.email,
        deleted: false
      },
      result: restored,
      description: `user restored`
    };
  }
);

export const setUserAsVerifiedService = async (userId: string) =>
  setUserAsVerifiedModel(userId);