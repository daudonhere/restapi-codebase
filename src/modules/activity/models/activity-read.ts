import { config } from "../../../configs";
import { ActivityFilterInterface, ActivityLogInterface } from "../../../interfaces/activity-interface";

export const countActivityLogModel = async (
  filters: ActivityFilterInterface
): Promise<number> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters.module) {
    conditions.push(`module = $${idx++}`);
    values.push(filters.module);
  }
  if (filters.action) {
    conditions.push(`action = $${idx++}`);
    values.push(filters.action);
  }
  if (filters.userId) {
    conditions.push(`user_id = $${idx++}`);
    values.push(filters.userId);
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.dateFrom) {
    conditions.push(`created_at >= $${idx++}`);
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`created_at <= $${idx++}`);
    values.push(filters.dateTo);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await config.query<{ count: number }>(
    `
    SELECT COUNT(*)::int AS count
    FROM tb_activity
    ${whereClause}
    `,
    values
  );

  return result.rows[0]?.count ?? 0;
};

export const findActivityLogModel = async (
  limit: number,
  offset: number,
  filters: ActivityFilterInterface
): Promise<ActivityLogInterface[]> => {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  if (filters.module) {
    conditions.push(`module = $${idx++}`);
    values.push(filters.module);
  }
  if (filters.action) {
    conditions.push(`action = $${idx++}`);
    values.push(filters.action);
  }
  if (filters.userId) {
    conditions.push(`user_id = $${idx++}`);
    values.push(filters.userId);
  }
  if (filters.status) {
    conditions.push(`status = $${idx++}`);
    values.push(filters.status);
  }
  if (filters.dateFrom) {
    conditions.push(`created_at >= $${idx++}`);
    values.push(filters.dateFrom);
  }
  if (filters.dateTo) {
    conditions.push(`created_at <= $${idx++}`);
    values.push(filters.dateTo);
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  values.push(limit);
  values.push(offset);

  const result = await config.query<ActivityLogInterface>(
    `
    SELECT *
    FROM tb_activity
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );

  return result.rows;
};

export const findActivityLogByIdModel = async (
  id: string
): Promise<ActivityLogInterface | null> => {
  const result = await config.query<ActivityLogInterface>(
    `SELECT * FROM tb_activity WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};