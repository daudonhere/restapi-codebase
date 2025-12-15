import axios from "axios";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { z } from "zod";
import {
  GitHubEmailSchema,
  GitHubProfileSchema,
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
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const GITHUB_REDIRECT_PATH = process.env.GITHUB_REDIRECT_PATH!;
const GITHUB_REDIRECT_URI = `${HOST.replace(
  /$/,
  ""
)}:${PORT}${GITHUB_REDIRECT_PATH}`;

const getGithubAccessToken = async (code: string): Promise<string> => {
  const response = await axios.post(
    "https://github.com/login/oauth/access_token",
    {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: GITHUB_REDIRECT_URI,
    },
    { headers: { Accept: "application/json" } }
  );

  const { access_token, error, error_description } = response.data;

  if (access_token) {
    return access_token;
  }

  throw new ResponsError(
    Code.BAD_REQUEST,
    error_description || error || "failed to get github access token"
  );
};

const getGithubUserProfile = async (accessToken: string) => {
  const res = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` },
  });
  return GitHubProfileSchema.parse(res.data);
};

const getGithubUserEmail = async (
  accessToken: string
): Promise<string | null> => {
  const res = await axios.get("https://api.github.com/user/emails", {
    headers: { Authorization: `token ${accessToken}` },
  });

  const emails = GitHubEmailSchema.parse(res.data);
  const primaryEmail = emails.find((e) => e.primary && e.verified);

  return primaryEmail ? primaryEmail.email : null;
};

export const processGithubLoginService = withActivityLog(
  { module: "auth", action: "github login" },

  async (context, input: unknown) => {
    const code = z.string().min(1).parse(input);

    const beforeData = { code };

    const githubAccessToken = await getGithubAccessToken(code);
    const profile = await getGithubUserProfile(githubAccessToken);
    const email = await getGithubUserEmail(githubAccessToken);

    if (!email) {
      throw new ResponsError(
        Code.NOT_FOUND,
        "failed to get verified github email"
      );
    }

    let user = await findUserByEmailModel(email, true);
    let createdPhrase: string | null = null;

    if (user) {
      if (user.is_delete) {
        throw new ResponsError(
          Code.FORBIDDEN,
          "user access revoked, contact administrator"
        );
      }

      if (user.source !== "github") {
        throw new ResponsError(
          Code.CONFLICT,
          `this email is registered via ${user.source}`
        );
      }
    } else {
      const randomPassword = crypto.randomBytes(20).toString("hex");
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      const fullname = profile.name || profile.login;

      const phrase = generatePhrase();
      const hashedPhrase = await bcrypt.hash(phrase, 10);
      createdPhrase = phrase;

      user = await createUserModel(
        {
          email,
          password: "ssopass", // Dummy password for Zod schema validation
          fullname,
        },
        hashedPassword,
        "github",
        context.ip,
        context.userAgent,
        createdPhrase,
        hashedPhrase
      );

      await setUserAsVerifiedModel(user.id);
    }

    if (!user || user.source !== "github") {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "github login failed");
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
      afterData: { userId: user.id, source: "github" },
      result: {
        accessToken,
        refreshToken,
        user: {
          ...user,
          phrase: createdPhrase,
        },
      },
      description: "github login successful",
    };
  }
);