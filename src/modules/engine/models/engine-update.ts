import { config } from "../../../configs";

export const createModuleModel = async (
  name: string,
  path: string,
  installed: boolean
) => {
  const result = await config.query(
    `
    INSERT INTO tb_engine (name, path, installed)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
    [name, path, installed]
  );
  return result.rows[0];
};

export const updateModuleStatusModel = async (id: string, installed: boolean) => {
  const result = await config.query(
    `
    UPDATE tb_engine
    SET installed = $1, updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [installed, id]
  );
  return result.rows[0];
};