import bcrypt from "bcrypt";
import crypto from "crypto";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { sendVerificationEmail, isEmailOnAllowList } from "../../../utils/email";
import { findUserByEmailModel } from "../models/user-read";
import {
  createUserModel,
  setUserAsVerifiedModel,
  restoreUserByIdModel,
} from "../models/user-create";
import { updateLastLoginModel } from "../models/user-update";
import { deleteTokenByUserAndTypeModel, deleteTokenModel } from "../../auth/models/token-delete";
import { saveTokenModel } from "../../auth/models/token-create";
import { findTokenModel } from "../../auth/models/token-read";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiresAt,
  saveRefreshToken,
  toMs,
} from "../../auth/controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { generatePhrase } from "../../../utils/phrase";
import {
  CreateUserSchema,
  UserEmailSchema,
  UserVerificationSchema,
} from "../schema/user-schema";

export const generateVerificationCode = (): string =>
  crypto.randomInt(100000, 999999).toString();

export const sendVerificationCodeService = withActivityLog(
  { module: "user", action: "send verification code" },
  async (context, input: unknown) => {
    const { email } = UserEmailSchema.parse(input);

    const user = await findUserByEmailModel(email);
    if (!user) throw new ResponsError(Code.NOT_FOUND, "user not found");
    if (user.is_verified)
      throw new ResponsError(Code.CONFLICT, "already verified");

    await deleteTokenByUserAndTypeModel(user.id, "verify");

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await saveTokenModel(user.id, code, "verify", expiresAt);
    sendVerificationEmail(email, code).catch(() => {});

    return {
      userId: user.id,
      statusCode: Code.OK,
      result: { emailSent: true },
      description: "verification code sending in background",
    };
  }
);

export const confirmVerificationCodeService = withActivityLog(
  { module: "user", action: "confirm verification code" },
  async (context, input: unknown) => {
    const { email, code } = UserVerificationSchema.parse(input);

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
      roles: user.roles,
    });

    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt = getRefreshExpiresAt(toMs);

    await saveRefreshToken(user.id, refreshToken, expiresAt);

    return {
      userId: user.id,
      statusCode: Code.OK,
      result: { accessToken, refreshToken, user },
      description: "email verified",
    };
  }
);

export const createUserService = withActivityLog(
  { module: "user", action: "create user" },
  async (context, input: unknown) => {
    const data = CreateUserSchema.parse(input);

    if (!isEmailOnAllowList(data.email))
      throw new ResponsError(Code.BAD_REQUEST, "email provider not allowed");

    const existing = await findUserByEmailModel(data.email, true);
    if (existing) {
      if (existing.is_delete)
        throw new ResponsError(Code.FORBIDDEN, "user access revoked");
      throw new ResponsError(Code.CONFLICT, "email already registered");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const phrase = generatePhrase();
    const hashedPhrase = await bcrypt.hash(phrase, 10);

    const user = await createUserModel(
      data,
      hashedPassword,
      "email",
      context.ip,
      context.userAgent,
      phrase,
      hashedPhrase
    );

    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await saveTokenModel(user.id, code, "verify", expiresAt);
    sendVerificationEmail(user.email, code).catch(() => {});

    return {
      userId: user.id,
      statusCode: Code.CREATED,
      result: {
        user: { ...user, phrase },
        emailSent: true,
      },
      description: "user created, email sending in background",
    };
  }
);

export const restoreUserByIdService = withActivityLog(
  { module: "user", action: "restore user" },
  async (_context, id: unknown, actor: unknown) => {
    const restored = await restoreUserByIdModel(id);
    if (!restored)
      throw new ResponsError(Code.NOT_FOUND, "user not found or not deleted");

    return {
      userId: (actor as any).id ?? null,
      statusCode: Code.OK,
      result: restored,
      description: "user restored",
    };
  }
);