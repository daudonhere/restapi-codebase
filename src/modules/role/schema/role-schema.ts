import { z } from "zod";

export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
  is_system: z.boolean(),
  created_at: z.union([z.date(), z.string()]),
  updated_at: z.union([z.date(), z.string()]),
});

export const CreateRoleInputSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable(),
  isSystem: z.boolean(),
});

export const UpdateRoleInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable(),
});

export const RoleIdSchema = z.object({
  id: z.string().uuid(),
});

export const BulkRoleIdsSchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1),
});

export const RoleCreateBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  is_system: z.boolean().optional(),
});

export const RoleUpdateBodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

export const RoleIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const RoleBulkDeleteBodySchema = z.object({
  roleIds: z.array(z.string().uuid()).min(1),
});

export type Role = z.infer<typeof RoleSchema>;
export type CreateRoleInput = z.infer<typeof CreateRoleInputSchema>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleInputSchema>;
