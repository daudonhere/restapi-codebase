import { config } from "../../../configs";
import {
  EngineModule,
  UpdateEngineStatusSchema,
} from "../schema/engine-schema";

export const updateModuleStatusModel = async (
  input: unknown
): Promise<EngineModule | null> => {
  const { id, installed } =
    UpdateEngineStatusSchema.parse(input);

  const result = await config.query<EngineModule>(
    `
    UPDATE tb_engine
    SET installed = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, name, path, installed, created_at, updated_at
    `,
    [installed, id]
  );

  return result.rows[0] ?? null;
};
