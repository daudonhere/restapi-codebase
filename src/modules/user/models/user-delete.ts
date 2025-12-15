import { config } from "../../../configs";
import { User } from "../schema/user-schema";

export const softDeleteUserModel = async (id: unknown): Promise<void> => {
  await config.query(
    `
    UPDATE tb_user
    SET is_delete = TRUE,
        deleted_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    `,
    [id]
  );
};

export const findDeletedUsersModel = async (
  limit: number,
  offset: number
): Promise<User[]> => {
  const result = await config.query<User>(
    `
    SELECT 
      u.*,
      COALESCE(json_agg(r.name) FILTER (WHERE r.name IS NOT NULL), '[]') AS roles
    FROM tb_user u
    LEFT JOIN tb_user_role ur ON u.id = ur.user_id
    LEFT JOIN tb_role r ON ur.role_id = r.id
    WHERE u.is_delete = TRUE
    GROUP BY u.id
    ORDER BY u.deleted_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );

  return result.rows;
};

export const countDeletedUsersModel = async (): Promise<number> => {
  const result = await config.query(
    `
    SELECT COUNT(*)::int AS count
    FROM tb_user
    WHERE is_delete = TRUE
    `
  );

  return result.rows[0]?.count ?? 0;
};

export const hardDeleteUserModel = async (
  id: unknown
): Promise<User | null> => {
  const result = await config.query<User>(
    `
    DELETE FROM tb_user
    WHERE id = $1
    RETURNING *
    `,
    [id]
  );

  return result.rows[0] || null;
};
