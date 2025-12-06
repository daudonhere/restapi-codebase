import { config } from "../../../configs";
import { QueryResult } from "pg";
import { UserInterface } from "../../../interfaces/user-interface";

export const findUserByIdModel = async (id: string): Promise<UserInterface | null> => {
  const result: QueryResult = await config.query(
    `
    SELECT 
      u.*, 
      COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') AS roles
    FROM tb_user u
    LEFT JOIN tb_user_role ur ON u.id = ur.user_id
    LEFT JOIN tb_role r ON ur.role_id = r.id
    WHERE u.id = $1
      AND u.is_delete = FALSE
    GROUP BY u.id
    `,
    [id]
  );
  return result.rows[0] || null;
};

export const findUserByEmailModel = async (
  email: string,
  includeDeleted = false
): Promise<UserInterface | null> => {
  let query = `
    SELECT 
      u.*, 
      COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') AS roles
    FROM tb_user u
    LEFT JOIN tb_user_role ur ON u.id = ur.user_id
    LEFT JOIN tb_role r ON ur.role_id = r.id
    WHERE u.email = $1
  `;

  if (!includeDeleted) {
    query += " AND u.is_delete = FALSE";
  }

  query += " GROUP BY u.id";

  const result: QueryResult = await config.query(query, [email]);
  return result.rows[0] || null;
};

export const findAllUsersModel = async (
  limit: number,
  offset: number
): Promise<Omit<UserInterface, "password">[]> => {
  const result = await config.query(
    `
    SELECT 
      u.id, u.fullname, u.avatar, u.email, u.phone, u.frequency, u.code,
      u.pin, u.passphrase, u.source, u.is_verified, u.login_at,
      u.ip_address, u.user_agent,
      u.created_at, u.updated_at,
      COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') AS roles
    FROM tb_user u
    LEFT JOIN tb_user_role ur ON u.id = ur.user_id
    LEFT JOIN tb_role r ON ur.role_id = r.id
    WHERE u.is_delete = FALSE
    GROUP BY u.id
    ORDER BY u.created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );
  return result.rows;
};

export const countAllUsersModel = async (): Promise<number> => {
  const result = await config.query(
    `SELECT COUNT(*)::int AS count FROM tb_user WHERE is_delete = FALSE`
  );
  return result.rows[0].count;
};