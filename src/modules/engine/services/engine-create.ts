import { engineRegistry } from "../controllers/engine-create";
import { findModuleByNameModel } from "../models/engine-read";
import { createModuleModel } from "../models/engine-create";
import { updateModuleStatusModel } from "../models/engine-update";

export const autoRegisterModules = async () => {
  for (const mod of engineRegistry) {
    const exists = await findModuleByNameModel(mod.name);

    if (!exists) {
      await createModuleModel(mod.name, mod.path, mod.core ? true : false);
      console.log(`registered module ${mod.name}`);
      continue;
    }

    if (mod.core && !exists.installed) {
      await updateModuleStatusModel(exists.id, true);
      console.log(`forced core module installed ${mod.name}`);
    }
  }
  console.log("module registry synchronized");
};
