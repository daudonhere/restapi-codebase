import { config } from "../../../configs";
import { RoleInterface } from "../../../interfaces/role-interface";

export const countAllRolesModel = async (): Promise<number> => {
  const result = await config.query(`SELECT COUNT(*)::int AS count FROM tb_role`);
  return result.rows[0]?.count ?? 0;
};

export const countUsersInRoleModel = async (roleId: string): Promise<number> => {
  const result = await config.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM tb_user_role WHERE role_id = $1`,
    [roleId]
  );
  return result.rows[0]?.count ?? 0;
};

export const findAllRolesModel = async (
  limit: number,
  offset: number
): Promise<RoleInterface[]> => {
  const result = await config.query<RoleInterface>(
    `
    SELECT *
    FROM tb_role
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
    `,
    [limit, offset]
  );
  return result.rows;
};

export const findRoleByNameModel = async (
  name: string
): Promise<RoleInterface | null> => {
  const result = await config.query<RoleInterface>(
    `SELECT * FROM tb_role WHERE LOWER(name) = LOWER($1) LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};


export const findRoleByIdModel = async (
  id: string
): Promise<RoleInterface | null> => {
  const result = await config.query<RoleInterface>(
    `SELECT * FROM tb_role WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};
