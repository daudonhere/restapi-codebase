import { RefreshTokenSchema } from "../schema/auth-schema";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findTokenModel } from "../models/token-read";
import { findUserByIdModel } from "../../user/models/user-read";
import {
  generateAccessToken,
  decodeRefreshToken,
  revokeRefreshToken,
} from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

export const refreshAccessTokenService = withActivityLog(
  { module: "auth", action: "refresh token" },

  async (_context, token: string) => {
    RefreshTokenSchema.parse({ token });

    const stored = await findTokenModel(token, "refresh");
    if (!stored) {
      throw new ResponsError(Code.FORBIDDEN, "refresh token invalid");
    }

    if (stored.expired_at < new Date()) {
      throw new ResponsError(Code.UNAUTHORIZED, "refresh token expired");
    }

    const decoded = decodeRefreshToken(token);
    const user = await findUserByIdModel(decoded.id);
    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });

    return {
      userId: user.id,
      statusCode: Code.OK,
      beforeData: { token },
      afterData: null,
      result: { accessToken },
      description: "access token refreshed",
    };
  }
);

export const logoutUserService = withActivityLog(
  { module: "auth", action: "logout" },

  async (_context, token: string) => {
    RefreshTokenSchema.parse({ token });

    let userId: string | null = null;
    try {
      userId = decodeRefreshToken(token).id;
    } catch {
      userId = null;
    }

    await revokeRefreshToken(token);

    return {
      userId,
      statusCode: Code.OK,
      beforeData: { userId },
      afterData: null,
      result: null,
      description: "user logged out",
    };
  }
);