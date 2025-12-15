import { config } from "../../../configs";
import { Role, UpdateRoleInputSchema } from "../schema/role-schema";

export const updateRoleModel = async (
  input: unknown
): Promise<Role | null> => {
  const { id, name, description } = UpdateRoleInputSchema.parse(input);

  const result = await config.query<Role>(
    `
    UPDATE tb_role
    SET
      name = $1,
      description = COALESCE($2, description),
      updated_at = NOW()
    WHERE id = $3
    RETURNING
      id,
      name,
      description,
      is_system,
      created_at,
      updated_at
    `,
    [name.trim(), description, id]
  );

  return result.rows[0] ?? null;
};
