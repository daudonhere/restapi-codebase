import { config } from "../../../configs";

export const updateModuleStatusModel = async (
  id: string,
  installed: boolean
) => {
  const result = await config.query(
    `
    UPDATE tb_engine
    SET installed = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, name, path, installed, created_at, updated_at
    `,
    [installed, id]
  );
  return result.rows[0] || null;
};
