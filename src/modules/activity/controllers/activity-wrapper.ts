import { ActivityContext } from "../schema/activity-schema";
import { logActivitySuccess, logActivityError } from "./activity-create";
import { Code } from "../../../constants/message-code";

interface ActivityMeta {
  module: string;
  action: string;
  userId?: string | null;
}

export const withActivityLog = <T = any>(
  meta: ActivityMeta,
  handler: (
    context: ActivityContext,
    ...args: any[]
  ) => Promise<any>
) => {
  return async (context: ActivityContext, ...args: any[]): Promise<T> => {
    try {
      const response = await handler(context, ...args);

      await logActivitySuccess({
        module: meta.module,
        action: meta.action,
        userId: response?.userId ?? meta.userId ?? null,
        context,
        beforeData: response?.beforeData ?? response?.before ?? null,
        afterData: response?.afterData ?? response?.after ?? null,
        description:
          response?.description ?? `${meta.action} successful`,
        statusCode: response?.statusCode ?? Code.OK,
      });

      return response?.result ?? response;
    } catch (err) {
      await logActivityError({
        module: meta.module,
        action: meta.action,
        userId: meta.userId ?? null,
        context,
        beforeData: null,
        error: err,
      });

      throw err;
    }
  };
};
