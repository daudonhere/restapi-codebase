import axios from "axios";
import bcrypt from "bcrypt";
import crypto from "crypto";
import dotenv from "dotenv";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findUserByEmailModel } from "../../user/models/user-read";
import { createUserModel, setUserAsVerifiedModel } from "../../user/models/user-create";
import { updateLastLoginModel } from "../../user/models/user-update";
import { GithubTokenResponseInterface, GithubUserResponseInterface, GithubEmailResponseInterface } from "../../../interfaces/github-interface";
import { generateAccessToken, generateRefreshToken, getRefreshExpiresAt, saveRefreshToken, toMs } from "../controllers/token-manage";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { generatePhrase } from "../../../utils/phrase";

dotenv.config();

const HOST = process.env.HOST!;
const PORT = process.env.PORT!;
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const GITHUB_REDIRECT_PATH = process.env.GITHUB_REDIRECT_PATH!;
const GITHUB_REDIRECT_URI = `${HOST.replace(/\/$/, "")}:${PORT}${GITHUB_REDIRECT_PATH}`;

const getGithubAccessToken = async (code: string): Promise<string> => {
  const params = {
    client_id: GITHUB_CLIENT_ID,
    client_secret: GITHUB_CLIENT_SECRET,
    code,
    redirect_uri: GITHUB_REDIRECT_URI
  };

  const response = await axios.post<GithubTokenResponseInterface>(
    "https://github.com/login/oauth/access_token",
    params,
    { headers: { Accept: "application/json" } }
  );

  if (response.data.access_token) return response.data.access_token;

  throw new ResponsError(
    Code.BAD_REQUEST,
    response.data["error_description"] || "Failed to get access token"
  );
};

const getGithubUserProfile = async (accessToken: string): Promise<GithubUserResponseInterface> => {
  const res = await axios.get("https://api.github.com/user", {
    headers: { Authorization: `token ${accessToken}` }
  });
  return res.data;
};

const getGithubUserEmail = async (accessToken: string): Promise<string | null> => {
  const res = await axios.get<GithubEmailResponseInterface[]>(
    "https://api.github.com/user/emails",
    { headers: { Authorization: `token ${accessToken}` } }
  );

  const primary = res.data.find((e) => e.primary && e.verified);
  return primary ? primary.email : null;
};

export const processGithubLoginService = withActivityLog(
  { module: "auth", action: "github login" },

  async (context, code: string) => {
    const beforeData = { code };
    const accessTokenGithub = await getGithubAccessToken(code);

    const profile = await getGithubUserProfile(accessTokenGithub);
    const userEmail = await getGithubUserEmail(accessTokenGithub);

    if (!userEmail) {
      throw new ResponsError(
        Code.NOT_FOUND,
        "failed to get a verified primary email from GitHub"
      );
    }

    let user = await findUserByEmailModel(userEmail, true);
    let createdPhrase: string | null = null;

    if (user) {
      if (user.is_delete) {
        throw new ResponsError(Code.FORBIDDEN, "user access revoked, contact your administrator or register with another way");
      }

      if (user.source !== "github") {
        throw new ResponsError(
          Code.CONFLICT,
          `this email is registered via ${user.source}, use ${user.source} login`
        );
      }
    } else {
      const randomPass = crypto.randomBytes(20).toString("hex");
      const hashedPass = await bcrypt.hash(randomPass, 10);
      const fullname = profile.name || profile.login;

      const phrase = generatePhrase();
      const hashedPhrase = await bcrypt.hash(phrase, 10);
      createdPhrase = phrase;

      user = await createUserModel(
        userEmail,
        hashedPass,
        fullname,
        "github",
        context.ip,
        context.userAgent,
        hashedPhrase
      );

      await setUserAsVerifiedModel(user.id);
    }

    if (user.source !== "github") {
      throw new ResponsError(
        Code.CONFLICT,
        `this email is registered via ${user.source}, use ${user.source} login`
      );
    }

    if (!user) {
      throw new ResponsError(Code.INTERNAL_SERVER_ERROR, "user load failed");
    }

    await updateLastLoginModel(user.id);

    const accessToken = generateAccessToken({
      id: user.id,
      email: user.email,
      roles: user.roles
    });

    const refreshToken = generateRefreshToken({ id: user.id });
    const expiresAt = getRefreshExpiresAt(toMs);

    await saveRefreshToken(user.id, refreshToken, expiresAt);

    const afterData = {
      userId: user.id,
      source: "github"
    };

    return {
      userId: user.id,
      statusCode: Code.OK,
      beforeData,
      afterData,
      result: {
        accessToken,
        refreshToken,
        user : {
          ...user,
          phrase: createdPhrase
        }
      },
      description: "github login successful"
    };
  }
);