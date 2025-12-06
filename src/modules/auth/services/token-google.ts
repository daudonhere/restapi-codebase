import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import crypto from "crypto";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { GoogleUserInterface } from "../../../interfaces/google-interface";
import { findUserByEmailModel  } from "../../user/models/user-read";
import { createUserModel, setUserAsVerifiedModel } from "../../user/models/user-create";
import { updateLastLoginModel } from "../../user/models/user-update";
import { generateAccessToken, generateRefreshToken, getRefreshExpiresAt, saveRefreshToken, toMs } from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

dotenv.config();

["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "HOST", "PORT", "GOOGLE_REDIRECT_PATH"].forEach(
  (key) => {
    if (!process.env[key]) {
      console.error(`missing environment variable ${key}`);
      process.exit(1);
    }
  }
);

const HOST = process.env.HOST!;
const PORT = process.env.PORT!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_PATH = process.env.GOOGLE_REDIRECT_PATH!;
const GOOGLE_REDIRECT_URI = `${HOST.replace(/\/$/, "")}:${PORT}${GOOGLE_REDIRECT_PATH}`;

const client = new OAuth2Client(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI);

export const getGoogleAuthURLService = (): string => {
  const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
  const params = new URLSearchParams({
    redirect_uri: GOOGLE_REDIRECT_URI,
    client_id: GOOGLE_CLIENT_ID,
    access_type: "offline",
    response_type: "code",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ].join(" "),
  });
  return `${rootUrl}?${params.toString()}`;
};

export const getGoogleUserService = async (code: string): Promise<GoogleUserInterface> => {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);
  const response = await client.request<GoogleUserInterface>({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });
  return response.data;
};

export const handleGoogleLoginService = withActivityLog(
  {
    module: "auth",
    action: "google login",
  },

  async (context, code: string) => {
    const beforeData = { code };
    let googleUser: GoogleUserInterface | null = null;
    googleUser = await getGoogleUserService(code);

    if (!googleUser?.email) {
      throw new ResponsError(Code.NOT_FOUND, "google user has no verified email");
    }

    let user = await findUserByEmailModel(googleUser.email, true);

    if (user) {
      if (user.is_delete) {
        throw new ResponsError(Code.FORBIDDEN, "user access revoked, contact your administrator or register with another way");
      }

      if (user.source !== "google") {
        throw new ResponsError(
          Code.CONFLICT,
          `this email is registered via ${user.source}, please use ${user.source} login`
        );
      }
    } else {
      const randomPassword = crypto.randomBytes(20).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const fullname =
        googleUser.name ?? googleUser.given_name ?? "Google User";

      user = await createUserModel(
        googleUser.email,
        hashedPassword,
        fullname,
        "google",
        null,
        null
      );

      await setUserAsVerifiedModel(user.id);
    }

    if (user.source !== "google") {
      throw new ResponsError(
        Code.CONFLICT,
        `this email is registered via ${user.source}, please use ${user.source} login`
      );
    }

    if (!user) {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "failed to load user");
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

    const afterData = { userId: user.id, source: "google" };

    return {
      userId: user.id,
      statusCode: Code.OK,
      beforeData,
      afterData,
      description: "google login successful",
      result: {
        accessToken,
        refreshToken,
        user
      },
    };
  }
);