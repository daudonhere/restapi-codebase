import { config } from "../../../configs";
import { Role, RoleIdSchema } from "../schema/role-schema";

export const countAllRolesModel = async (): Promise<number> => {
  const result = await config.query(`SELECT COUNT(*)::int AS count FROM tb_role`);
  return result.rows[0]?.count ?? 0;
};

export const countUsersInRoleModel = async (roleId: unknown): Promise<number> => {
  const { id } = RoleIdSchema.parse({ id: roleId });

  const result = await config.query<{ count: number }>(
    `
    SELECT COUNT(*)::int AS count
    FROM tb_user_role
    WHERE role_id = $1
    `,
    [id]
  );

  return result.rows[0]?.count ?? 0;
};

export const findAllRolesModel = async (
  limit: number,
  offset: number
): Promise<Role[]> => {
  const result = await config.query<Role>(
    `
    SELECT
      id,
      name,
      description,
      is_system,
      created_at,
      updated_at
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
): Promise<Role | null> => {
  const result = await config.query<Role>(
    `
    SELECT
      id,
      name,
      description,
      is_system,
      created_at,
      updated_at
    FROM tb_role
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
    `,
    [name.trim()]
  );

  return result.rows[0] || null;
};

export const findRoleByIdModel = async (
  id: unknown
): Promise<Role | null> => {
  const parsed = RoleIdSchema.parse({ id });

  const result = await config.query<Role>(
    `
    SELECT
      id,
      name,
      description,
      is_system,
      created_at,
      updated_at
    FROM tb_role
    WHERE id = $1
    `,
    [parsed.id]
  );

  return result.rows[0] || null;
};
