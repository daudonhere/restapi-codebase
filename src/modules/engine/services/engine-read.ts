import { findAllModulesModel } from "../models/engine-read";
import { EngineModule } from "../schema/engine-schema";

export const getAllModulesService = async (): Promise<EngineModule[]> => {
  return findAllModulesModel();
};
