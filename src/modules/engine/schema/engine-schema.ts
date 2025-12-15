import { z } from "zod";

export const EngineModuleSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  path: z.string().min(1),
  installed: z.boolean(),
  created_at: z.union([z.date(), z.string()]),
  updated_at: z.union([z.date(), z.string()]),
});

export const CreateEngineModuleSchema = z.object({
  name: z.string().min(1),
  path: z.string().min(1),
  installed: z.boolean(),
});

export const UpdateEngineStatusSchema = z.object({
  id: z.string().uuid(),
  installed: z.boolean(),
});

export const EngineModuleNameSchema = z.object({
  name: z.string().min(1),
});

export type EngineModule = z.infer<typeof EngineModuleSchema>;
