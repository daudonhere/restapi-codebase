import { config } from "../../../configs";
import { ActivityFilterInterface, ActivityLogInterface } from "../../../interfaces/activity-interface";

export const countActivityLogModel = async (
  filters: ActivityFilterInterface
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
  filters: ActivityFilterInterface
) => {
  const { whereClause, values, idx } = buildActivityFilter(filters);

  const limitIndex = idx;
  const offsetIndex = idx + 1;

  values.push(limit);
  values.push(offset);

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
    LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `,
    values
  );

  return result.rows;
};

export const findActivityLogByIdModel = async (
  id: string
) => {
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

export const buildActivityFilter = (filters: any) => {
  const conditions: string[] = [];
  const values: any[] = [];
  let idx = 1;

  const addFilter = (field: string, value: any, operator = "=") => {
    if (value !== undefined && value !== null) {
      conditions.push(`${field} ${operator} $${idx++}`);
      values.push(value);
    }
  };

  addFilter("module", filters.module);
  addFilter("action", filters.action);
  addFilter("user_id", filters.userId);
  addFilter("status", filters.status);
  addFilter("created_at", filters.dateFrom, ">=");
  addFilter("created_at", filters.dateTo, "<=");

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { whereClause, values, idx };
};
