import { config } from "../../../configs";
import { Role, CreateRoleInputSchema } from "../schema/role-schema";

export const createRoleModel = async (
  input: unknown
): Promise<Role> => {
  const { name, description, isSystem } = CreateRoleInputSchema.parse(input);

  const result = await config.query<Role>(
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
