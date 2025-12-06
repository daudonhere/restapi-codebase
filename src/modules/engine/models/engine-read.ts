import { config } from "../../../configs";

export const findAllModulesModel = async () => {
  const result = await config.query(
    `SELECT * FROM tb_engine ORDER BY name ASC`
  );
  return result.rows;
};

export const findModuleByNameModel = async (name: string) => {
  const result = await config.query(
    `SELECT * FROM tb_engine WHERE name = $1 LIMIT 1`,
    [name]
  );
  return result.rows[0] || null;
};