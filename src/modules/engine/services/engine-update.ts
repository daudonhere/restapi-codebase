import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { findModuleByNameModel } from "../models/engine-read";
import { updateModuleStatusModel } from "../models/engine-update";
import { engineRegistry } from "../controllers/engine-create";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";
import { ActivityContext } from "../../activity/schema/activity-schema";
import { EngineModuleNameSchema } from "../schema/engine-schema";

const isCoreModule = (name: string): boolean => {
  return engineRegistry.some(
    (mod) => mod.name === name && mod.core
  );
};

export const toggleModuleService = withActivityLog(
  { module: "engine", action: "toggle module" },
  async (
    context: ActivityContext,
    name: string,
    actorId?: string
  ) => {
    const parsed = EngineModuleNameSchema.parse({ name });

    const before = await findModuleByNameModel(parsed.name);

    if (!before) {
      throw new ResponsError(
        Code.NOT_FOUND,
        `module ${parsed.name} not found`
      );
    }

    const newInstalled = !before.installed;

    if (isCoreModule(before.name) && !newInstalled) {
      throw new ResponsError(
        Code.FORBIDDEN,
        `cannot uninstall core module ${before.name}`
      );
    }

    const after = await updateModuleStatusModel({
      id: before.id,
      installed: newInstalled,
    });

    return {
      userId: actorId ?? null,
      result: after,
      beforeData: {
        id: before.id,
        name: before.name,
        path: before.path,
        installed: before.installed,
      },
      afterData: {
        id: after!.id,
        name: after!.name,
        path: after!.path,
        installed: after!.installed,
      },
      description: `module ${before.name} ${
        newInstalled ? "installed" : "uninstalled"
      }`,
    };
  }
);
