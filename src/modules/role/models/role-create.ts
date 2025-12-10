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
    RETURNING 
      id, 
      name,
      description,
      is_system,
      created_at,
      updated_at
    `,
    [name.trim(), description, isSystem]
  );

  return result.rows[0];
};
