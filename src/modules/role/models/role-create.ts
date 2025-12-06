import { config } from "../../../configs";
import { RoleInterface } from "../../../interfaces/role-interface";

export const createRoleModel = async (
  name: string,
  description: string | null,
  isSystem: boolean
): Promise<RoleInterface> => {
  const result = await config.query<RoleInterface>(
    `
    INSERT INTO tb_role (name, description, is_system)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, description, isSystem]
  );
  return result.rows[0];
};

export const updateRoleModel = async (
  id: string,
  name: string,
  description: string | null
): Promise<RoleInterface> => {
  const result = await config.query<RoleInterface>(
    `
    UPDATE tb_role
    SET
      name = $1,
      description = COALESCE($2, description),
      updated_at = NOW()
    WHERE id = $3
    RETURNING *
    `,
    [name, description, id]
  );
  return result.rows[0];
};