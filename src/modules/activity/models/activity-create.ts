import { config } from "../../../configs";
import { ActivityLogPayload } from "../schema/activity-schema";

export const writeActivityLogModel = async (
  payload: ActivityLogPayload
): Promise<string | null> => {
  try {
    const result = await config.query(
      `
      INSERT INTO tb_activity (
        user_id, module, action,
        endpoint, method, status_code, status,
        ip_address, user_agent,
        before_data, after_data, description
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      RETURNING id
      `,
      [
        payload.userId,
        payload.module,
        payload.action,
        payload.endpoint,
        payload.method,
        payload.statusCode,
        payload.status,
        payload.ipAddress,
        payload.userAgent,
        payload.beforeData,
        payload.afterData,
        payload.description,
      ]
    );

    return result.rows[0]?.id ?? null;
  } catch {
    return null;
  }
};
