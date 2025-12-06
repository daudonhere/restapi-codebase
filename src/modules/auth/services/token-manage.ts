import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findTokenModel } from "../models/token-read";
import { findUserByIdModel } from "../../user/models/user-read";
import { generateAccessToken, decodeRefreshToken, revokeRefreshToken } from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

export const refreshAccessTokenService = withActivityLog(
  {
    module: "auth",
    action: "refresh token",
  },
  async (context, token: string) => {
    const beforeData = { token };
    const storedToken = await findTokenModel(token, "refresh");
    if (!storedToken) {
      throw new ResponsError(
        Code.FORBIDDEN,
        "refresh token not found or has been revoked"
      );
    }
    if (storedToken.expired_at < new Date()) {
      throw new ResponsError(Code.UNAUTHORIZED, "refresh token expired");
    }
    const decoded = decodeRefreshToken(token);
    const user = await findUserByIdModel(decoded.id);
    if (!user) {
      throw new ResponsError(Code.NOT_FOUND, "user not found for token");
    }
    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles,
    });
    return {
      userId: user.id,
      beforeData,
      afterData: { userId: user.id },
      description: "access token refreshed successfully",
      statusCode: Code.OK,
      result: { accessToken },
    };
  }
);

export const logoutUserService = withActivityLog(
  {
    module: "auth",
    action: "logout",
  },
  async (context, token: string) => {
    let userId: string | null = null;
    try {
      const decoded = decodeRefreshToken(token);
      userId = decoded.id;
    } catch {
      userId = null;
    }
    await revokeRefreshToken(token);
    return {
      userId,
      beforeData: { userId },
      afterData: null,
      description: "user logged out and refresh token revoked",
      statusCode: Code.OK,
      result: null,
    };
  }
);