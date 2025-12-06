import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findModuleByNameModel } from "../models/engine-read";
import { updateModuleStatusModel } from "../models/engine-update";
import { engineRegistry } from "../controllers/engine-create";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { ActivityContextInterface } from "../../../interfaces/activity-interface";

const isCoreModule = (name: string): boolean => {
  return engineRegistry.some((mod) => mod.name === name && mod.core);
};

export const toggleModuleService = withActivityLog(
  { module: "engine", action: "toggle" },

  async (context: ActivityContextInterface, name: string, actorId?: string) => {
    const before = await findModuleByNameModel(name);

    if (!before) {
      throw new ResponsError(Code.NOT_FOUND, `module ${name} not found`);
    }

    const newInstalled = !before.installed;

    if (isCoreModule(before.name) && !newInstalled) {
      throw new ResponsError(
        Code.FORBIDDEN,
        `cannot uninstall core module ${before.name}`
      );
    }

    const after = await updateModuleStatusModel(before.name, newInstalled);

    return {
      result: after,
      before: {
        id: before.id,
        name: before.name,
        path: before.path,
        installed: before.installed,
      },
      after: {
        id: after.id,
        name: after.name,
        path: after.path,
        installed: after.installed,
      },
    };
  }
);
