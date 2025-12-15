import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { z } from "zod";
import {
  GoogleProfileSchema,
} from "../schema/auth-schema";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findUserByEmailModel } from "../../user/models/user-read";
import {
  createUserModel,
  setUserAsVerifiedModel,
} from "../../user/models/user-create";
import { updateLastLoginModel } from "../../user/models/user-update";
import {
  generateAccessToken,
  generateRefreshToken,
  getRefreshExpiresAt,
  saveRefreshToken,
  toMs,
} from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { generatePhrase } from "../../../utils/phrase";

dotenv.config();

const HOST = process.env.HOST!;
const PORT = process.env.PORT!;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const GOOGLE_REDIRECT_PATH = process.env.GOOGLE_REDIRECT_PATH!;
const GOOGLE_REDIRECT_URI = `${HOST.replace(
  /$/,
  ""
)}:${PORT}${GOOGLE_REDIRECT_PATH}`;

const client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const getGoogleUser = async (code: string) => {
  const { tokens } = await client.getToken(code);
  client.setCredentials(tokens);

  const res = await client.request({
    url: "https://www.googleapis.com/oauth2/v2/userinfo",
  });

  return GoogleProfileSchema.parse(res.data);
};

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
      "https://www.googleapis.com/auth/userinfo.profile"
    ].join(" ")
  });
  return `${rootUrl}?${params.toString()}`;
};

export const handleGoogleLoginService = withActivityLog(
  { module: "auth", action: "google login" },

  async (context, input: unknown) => {
    const code = z.string().min(1).parse(input);

    const beforeData = { code };

    const googleUser = await getGoogleUser(code);

    if (!googleUser.email || !googleUser.verified_email) {
      throw new ResponsError(
        Code.NOT_FOUND,
        "google user has no verified email"
      );
    }

    let user = await findUserByEmailModel(googleUser.email, true);
    let createdPhrase: string | null = null;

    if (user) {
      if (user.is_delete) {
        throw new ResponsError(
          Code.FORBIDDEN,
          "user access revoked, contact administrator"
        );
      }

      if (user.source !== "google") {
        throw new ResponsError(
          Code.CONFLICT,
          `this email is registered via ${user.source}`
        );
      }
    } else {
      const randomPassword = crypto.randomBytes(20).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      const phrase = generatePhrase();
      const hashedPhrase = await bcrypt.hash(phrase, 10);
      createdPhrase = phrase;

      const fullname =
        googleUser.name ??
        googleUser.given_name ??
        "Google User";

      user = await createUserModel(
        {
          email: googleUser.email,
          password: "ssopass", // Dummy password for Zod schema validation
          fullname,
        },
        hashedPassword,
        "google",
        context.ip,
        context.userAgent,
        createdPhrase,
        hashedPhrase
      );


      await setUserAsVerifiedModel(user.id);
    }

    if (!user || user.source !== "google") {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "google login failed");
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
      afterData: { userId: user.id, source: "google" },
      result: {
        accessToken,
        refreshToken,
        user: {
          ...user,
          phrase: createdPhrase,
        },
      },
      description: "google login successful",
    };
  }
);
