import bcrypt from "bcrypt";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findUserByEmailModel } from "../../user/models/user-read";
import { updateLastLoginModel } from "../../user/models/user-update";
import { generateAccessToken, generateRefreshToken, getRefreshExpiresAt, saveRefreshToken, toMs } from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

export const loginUserService = withActivityLog({module: "auth", action: "login",},
  async (context, email: string, password: string) => {
    const beforeData = { email };
    const user = await findUserByEmailModel(email, true);

    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found, please register");
    }

    if (user.is_delete) {
      throw new ResponsError(
        Code.FORBIDDEN,
        "user access revoked, contact your administrator or register with another way"
      );
    }

    if (user.source !== "email") {
      throw new ResponsError(
        Code.FORBIDDEN,
        `this account was registered via ${user.source}, please use ${user.source} login`
      );
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new ResponsError(Code.UNAUTHORIZED, "email or password is incorrect");
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
    const afterData = {
      userId: user.id,
      is_verified: user.is_verified,
    };
    return {
      userId: user.id,
      statusCode: Code.OK,
      beforeData,
      afterData,
      result: {
        accessToken,
        refreshToken,
        user
      },
      description: "user login successful",
    };
  }
);