import { config } from "../../../configs";
import { UserInterface } from "../../../interfaces/user-interface";

export const softDeleteUserModel = async (id: string): Promise<void> => {
  await config.query(
    `
    UPDATE tb_user
    SET 
      is_delete = TRUE,
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
): Promise<Omit<UserInterface, "password" | "pin" | "passphrase" | "code">[]> => {
  const result = await config.query(
    `
    SELECT 
      u.id,
      u.fullname,
      u.avatar,
      u.email,
      u.phone,
      u.source,
      u.is_verified,
      u.ip_address,
      u.user_agent,
      u.is_delete,
      u.deleted_at,
      u.login_at,
      u.created_at,
      u.updated_at,
      COALESCE(
        json_agg(r.name) FILTER (WHERE r.name IS NOT NULL),
        '[]'
      ) AS roles
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
    `SELECT COUNT(*)::int AS count FROM tb_user WHERE is_delete = TRUE`
  );
  return result.rows[0]?.count ?? 0;
};

export const hardDeleteUserModel = async (
  id: string
): Promise<Omit<UserInterface, "password" | "pin" | "passphrase" | "code"> | null> => {
  const result = await config.query(
    `
    DELETE FROM tb_user 
    WHERE id = $1
    RETURNING 
      id,
      fullname,
      avatar,
      email,
      phone,
      source,
      is_verified,
      login_at,
      ip_address,
      user_agent,
      is_delete,
      deleted_at,
      created_at,
      updated_at
    `,
    [id]
  );

  return result.rows[0] || null;
};