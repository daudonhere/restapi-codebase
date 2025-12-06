import { findAllModulesModel } from "../models/engine-read";

export const getAllModulesService = async () => {
  return findAllModulesModel();
};
