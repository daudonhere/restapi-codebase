import { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL;

export const githubAuthRedirectController = (
  _req: Request,
  res: Response
): void => {
  const authUrl = "https://github.com/login/oauth/authorize";
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID || "",
    redirect_uri: GITHUB_CALLBACK_URL || "",
    scope: "read:user,user:email",
    allow_signup: "true",
  });
  res.redirect(`${authUrl}?${params.toString()}`);
};