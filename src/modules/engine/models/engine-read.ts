import { config } from "../../../configs";
import {
  EngineModule,
  EngineModuleNameSchema,
} from "../schema/engine-schema";

export const findAllModulesModel = async (): Promise<EngineModule[]> => {
  const result = await config.query<EngineModule>(
    `
    SELECT id, name, path, installed, created_at, updated_at
    FROM tb_engine
    ORDER BY name ASC
    `
  );

  return result.rows;
};

export const findModuleByNameModel = async (
  name: unknown
): Promise<EngineModule | null> => {
  const parsed = EngineModuleNameSchema.parse({ name });

  const result = await config.query<EngineModule>(
    `
    SELECT id, name, path, installed, created_at, updated_at
    FROM tb_engine
    WHERE name = $1
    LIMIT 1
    `,
    [parsed.name]
  );

  return result.rows[0] || null;
};
