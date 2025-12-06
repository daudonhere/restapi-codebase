import { config } from "../../../configs";
import { ActivityLogPayloadInterface } from "../../../interfaces/activity-interface";

export const writeActivityLogModel = async (payload: ActivityLogPayloadInterface): Promise<void> => {
  try {
    await config.query(
      `
      INSERT INTO tb_activity (
        user_id,
        module,
        action,
        endpoint,
        method,
        status_code,
        status,
        ip_address,
        user_agent,
        before_data,
        after_data,
        description
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
      `,
      [
        payload.userId,
        payload.module,
        payload.action,
        payload.endpoint,
        payload.method,
        payload.statusCode,
        payload.status,
        payload.ipAddress || null,
        payload.userAgent || null,
        payload.beforeData ? JSON.stringify(payload.beforeData) : null,
        payload.afterData ? JSON.stringify(payload.afterData) : null,
        payload.description || null,
      ]
    );
  } catch (err) {
    console.error("Failed to write activity log cause", err);
  }
};
