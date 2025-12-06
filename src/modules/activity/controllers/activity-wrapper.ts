import { ActivityContextInterface } from "../../../interfaces/activity-interface";
import { logActivitySuccess, logActivityError } from "./activity-create";
import { Code } from "../../../constants/message-code";

interface ActivityMeta {
  module: string;
  action: string;
  userId?: string | null;
}

interface HandlerResult<T> {
  result: T;
  beforeData?: any;
  afterData?: any;
  userId?: string | null;
  statusCode?: number;
  description?: string;
}

export const withActivityLog = <T = any>(
  meta: ActivityMeta,
  handler: (context: ActivityContextInterface, ...args: any[]) => Promise<HandlerResult<T> | any>
) => {
  return async (context: ActivityContextInterface, ...args: any[]): Promise<T> => {
    try {
      const response = await handler(context, ...args);
      const userId = response.userId || meta.userId || null;
      const beforeData = response.beforeData || response.before || null;
      const afterData = response.afterData || response.after || null;
      const result = response.result;
      const statusCode = response.statusCode || Code.OK;
      const description = response.description || `${meta.action} successful`;

      await logActivitySuccess({
        module: meta.module,
        action: meta.action,
        userId: userId,
        context,
        beforeData,
        afterData,
        description,
        statusCode,
      });

      return result;
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