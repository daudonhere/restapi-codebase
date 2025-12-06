import { writeActivityLogModel } from "../models/activity-create";
import { LogSuccessParamsInterface, LogErrorParamsInterface } from "../../../interfaces/activity-interface";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";

export const logActivitySuccess = async ({
  module,
  action,
  userId = null,
  context,
  beforeData = null,
  afterData = null,
  description = "success",
  statusCode = Code.OK,
}: LogSuccessParamsInterface) => {
  await writeActivityLogModel({
    userId,
    module,
    action,
    endpoint: context.endpoint,
    method: context.method,
    status: "success",
    statusCode,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    beforeData,
    afterData,
    description,
  });
};

export const logActivityError = async ({
  module,
  action,
  userId = null,
  context,
  beforeData = null,
  error,
  description,
}: LogErrorParamsInterface) => {
  const statusCode =
    error instanceof ResponsError ? error.code : Code.INTERNAL_SERVER_ERROR;

  let finalDescription: string;

  if (description) {
    finalDescription = description;
  } else if (error instanceof ResponsError) {
    finalDescription = error.description;
  } else if (error instanceof Error) {
    finalDescription = error.message;
  } else {
    finalDescription = "unexpected error";
  }

  await writeActivityLogModel({
    userId,
    module,
    action,
    endpoint: context.endpoint,
    method: context.method,
    status: "error",
    statusCode,
    ipAddress: context.ip,
    userAgent: context.userAgent,
    beforeData,
    afterData: null,
    description: finalDescription,
  });
};