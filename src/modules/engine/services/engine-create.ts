import { engineRegistry } from "../controllers/engine-create";
import { findModuleByNameModel } from "../models/engine-read";
import { createModuleModel } from "../models/engine-create";
import { updateModuleStatusModel } from "../models/engine-update";

export const autoRegisterModules = async () => {
  for (const mod of engineRegistry) {
    const exists = await findModuleByNameModel(mod.name);

    if (!exists) {
      await createModuleModel({
        name: mod.name,
        path: mod.path,
        installed: Boolean(mod.core),
      });
      continue;
    }

    if (mod.core && !exists.installed) {
      await updateModuleStatusModel({
        id: exists.id,
        installed: true,
      });
    }
  }
};
