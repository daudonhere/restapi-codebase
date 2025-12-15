import { z } from "zod";

export const UserSourceSchema = z.enum(["email", "google", "github"]);

export const UserSchema = z.object({
  id: z.string().uuid(),
  fullname: z.string().nullable(),
  avatar: z.string().nullable(),
  email: z.string().email(),
  phone: z.string().nullable(),
  password: z.string(),
  frequency: z.string().nullable(),
  code: z.string().nullable(),
  pin: z.string().nullable(),
  passphrase: z.string().nullable(),
  source: UserSourceSchema.nullable(),
  is_verified: z.boolean(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
  is_delete: z.boolean(),
  deleted_at: z.date().nullable(),
  login_at: z.date().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
  roles: z.array(z.string()),
});

export const UserIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const UserEmailSchema = z.object({
  email: z.string().email(),
});

export const UserVerificationSchema = z.object({
  email: z.string().email(),
  code: z.string().min(1),
});

export const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullname: z.string().min(1),
});

export const UpdateUserProfileSchema = z.object({
  fullname: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  passphrase: z.string().min(1),
});

export const UpdateUserCredentialSchema = z.object({
  password: z.string().optional(),
  pin: z.string().optional(),
  code: z.string().optional(),
  frequency: z.string().optional(),
});

export const UpdateUserRolesSchema = z.object({
  roles: z.array(z.string()).min(1),
});

export const BulkUserIdsSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
});

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof UpdateUserProfileSchema>;
export type UpdateUserCredentialInput = z.infer<typeof UpdateUserCredentialSchema>;
export type UpdateUserRolesInput = z.infer<typeof UpdateUserRolesSchema>;
