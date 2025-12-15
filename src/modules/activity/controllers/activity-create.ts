import { writeActivityLogModel } from "../models/activity-create";
import {
  ActivityLogPayloadSchema,
  ActivityContext,
} from "../schema/activity-schema";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";

export const logActivitySuccess = async (params: {
  module: string;
  action: string;
  userId?: string | null;
  context: ActivityContext;
  beforeData?: any;
  afterData?: any;
  description?: string;
  statusCode?: number;
}) => {
  const parsed = ActivityLogPayloadSchema.safeParse({
    userId: params.userId ?? null,
    module: params.module,
    action: params.action,
    endpoint: params.context.endpoint,
    method: params.context.method,
    status: "success",
    statusCode: params.statusCode ?? Code.OK,
    ipAddress: params.context.ip,
    userAgent: params.context.userAgent,
    beforeData: params.beforeData ?? null,
    afterData: params.afterData ?? null,
    description: params.description ?? "success",
  });

  if (!parsed.success) return;

  await writeActivityLogModel(parsed.data);
};

export const logActivityError = async (params: {
  module: string;
  action: string;
  userId?: string | null;
  context: ActivityContext;
  beforeData?: any;
  error: unknown;
  description?: string;
}) => {
  const statusCode =
    params.error instanceof ResponsError
      ? params.error.code
      : Code.INTERNAL_SERVER_ERROR;

  const description =
    params.description ??
    (params.error instanceof ResponsError
      ? params.error.description
      : params.error instanceof Error
      ? params.error.message
      : "unexpected error");

  const parsed = ActivityLogPayloadSchema.safeParse({
    userId: params.userId ?? null,
    module: params.module,
    action: params.action,
    endpoint: params.context.endpoint,
    method: params.context.method,
    status: "error",
    statusCode,
    ipAddress: params.context.ip,
    userAgent: params.context.userAgent,
    beforeData: params.beforeData ?? null,
    afterData: null,
    description,
  });

  if (!parsed.success) return;

  await writeActivityLogModel(parsed.data);
};
