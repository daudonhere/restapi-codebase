import { z } from "zod";

export const ActivityContextSchema = z.object({
  endpoint: z.string().min(1),
  method: z.string().min(1),
  ip: z.string().nullable(),
  userAgent: z.string().nullable(),
  device: z
    .object({
      browser: z.string().nullable(),
      browserVersion: z.string().nullable(),
      os: z.string().nullable(),
      osVersion: z.string().nullable(),
      deviceModel: z.string().nullable(),
      deviceType: z.string().nullable(),
      engine: z.string().nullable(),
    })
    .optional(),
});

export const ActivityLogPayloadSchema = z.object({
  userId: z.string().uuid().nullable(),
  module: z.string().min(1),
  action: z.string().min(1),
  endpoint: z.string().min(1),
  method: z.string().min(1),
  status: z.enum(["success", "error"]),
  statusCode: z.number().int().positive(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  beforeData: z.any().nullable(),
  afterData: z.any().nullable(),
  description: z.string().nullable(),
});

export const ActivityFilterSchema = z.object({
  module: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const ActivityQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  module: z.string().optional(),
  action: z.string().optional(),
  userId: z.string().uuid().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

export const ActivityIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type ActivityContext = z.infer<typeof ActivityContextSchema>;
export type ActivityLogPayload = z.infer<typeof ActivityLogPayloadSchema>;
export type ActivityFilter = z.infer<typeof ActivityFilterSchema>;
