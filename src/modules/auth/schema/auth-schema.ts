import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export type LogoutInput = z.infer<typeof LogoutSchema>;

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

export const OAuthCallbackSchema = z.object({
  code: z.string().min(1),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

export type OAuthCallbackInput = z.infer<typeof OAuthCallbackSchema>;

// Schema for Google's user profile
export const GoogleProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  verified_email: z.boolean(),
  name: z.string().optional(),
  given_name: z.string().optional(),
  family_name: z.string().optional(),
  picture: z.string().url().optional(),
  locale: z.string().optional(),
});
export type GoogleProfile = z.infer<typeof GoogleProfileSchema>;

// Schemas for GitHub's user profile and email
export const GitHubProfileSchema = z.object({
  id: z.number().transform((v) => v.toString()), // GitHub ID is a number, transform to string
  login: z.string(),
  name: z.string().nullable(),
  avatar_url: z.string().url().optional(),
});
export type GitHubProfile = z.infer<typeof GitHubProfileSchema>;

export const GitHubEmailSchema = z.array(
  z.object({
    email: z.string().email(),
    primary: z.boolean(),
    verified: z.boolean(),
    visibility: z.string().nullable(),
  })
);
export type GitHubEmail = z.infer<typeof GitHubEmailSchema>;

export const OAuthFullnameSchema = z.string().min(1);

export const OAuthCodeSchema = z.object({
  code: z.string().min(5),
});

export const PayloadSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
});

export type Payload = z.infer<typeof PayloadSchema>;

