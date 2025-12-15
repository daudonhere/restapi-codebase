import bcrypt from "bcrypt";
import { LoginSchema } from "../schema/auth-schema";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findUserByEmailModel } from "../../user/models/user-read";
import { updateLastLoginModel } from "../../user/models/user-update";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiresAt,
  saveRefreshToken,
  toMs,
} from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

export const loginUserService = withActivityLog(
  { module: "auth", action: "login" },

  async (context, input: unknown) => {
    const { email, password } = LoginSchema.parse(input);

    const beforeData = { email };

    const user = await findUserByEmailModel(email, true);
    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found, please register");
    }

    if (user.is_delete) {
      throw new ResponsError(
        Code.FORBIDDEN,
        "user access revoked, contact administrator"
      );
    }

    if (user.source !== "email") {
      throw new ResponsError(
        Code.FORBIDDEN,
        `this account was registered via ${user.source}`
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new ResponsError(Code.BAD_REQUEST, "email or password is incorrect");
    }

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
      beforeData,
      afterData: { userId: user.id },
      result: {
        accessToken,
        refreshToken,
        user,
      },
      description: "user login successful",
    };
  }
);