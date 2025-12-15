import { config } from "../../../configs";
import { ActivityFilter } from "../schema/activity-schema";

export const buildActivityFilter = (filters: ActivityFilter) => {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const add = (field: string, value: any, operator = "=") => {
    if (value !== undefined && value !== null) {
      conditions.push(`${field} ${operator} $${idx++}`);
      values.push(value);
    }
  };

  add("module", filters.module);
  add("action", filters.action);
  add("user_id", filters.userId);
  add("status", filters.status);
  add("created_at", filters.dateFrom, ">=");
  add("created_at", filters.dateTo, "<=");

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values, idx };
};

export const countActivityLogModel = async (
  filters: ActivityFilter
): Promise<number> => {
  const { whereClause, values } = buildActivityFilter(filters);

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
  filters: ActivityFilter
) => {
  const { whereClause, values, idx } = buildActivityFilter(filters);

  values.push(limit, offset);

  const result = await config.query(
    `
    SELECT
      id,
      user_id,
      module,
      action,
      endpoint,
      method,
      status_code,
      status,
      ip_address,
      user_agent,
      created_at
    FROM tb_activity
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${idx} OFFSET $${idx + 1}
    `,
    values
  );

  return result.rows;
};

export const findActivityLogByIdModel = async (id: string) => {
  const result = await config.query(
    `
    SELECT
      id,
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
      description,
      created_at
    FROM tb_activity
    WHERE id = $1
    `,
    [id]
  );

  return result.rows[0] || null;
};