import { config } from "../../../configs";
import {
  CreateEngineModuleSchema,
  EngineModule,
} from "../schema/engine-schema";

export const createModuleModel = async (
  input: unknown
): Promise<EngineModule> => {
  const { name, path, installed } =
    CreateEngineModuleSchema.parse(input);

  const result = await config.query<EngineModule>(
    `
    INSERT INTO tb_engine (name, path, installed)
    VALUES ($1, $2, $3)
    RETURNING id, name, path, installed, created_at, updated_at
    `,
    [name, path, installed]
  );

  return result.rows[0];
};
