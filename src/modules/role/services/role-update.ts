import { findRoleByIdModel, findRoleByNameModel } from "../models/role-read";
import { updateRoleModel } from "../models/role-update";
import { ActivityContextInterface } from "../../../interfaces/activity-interface";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { withActivityLog } from "../../activity/controllers/activity-wrapper";

const isValidUUID = (value: string): boolean => {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(value);
};

export const updateRoleService = withActivityLog(
  { module: "role", action: "update role" },
  async (context: ActivityContextInterface, id: string, name: string, description: string | undefined, actorId: string) => {
    if (!isValidUUID(id)) throw new ResponsError(Code.NOT_FOUND, "role not valid");
    const before = await findRoleByIdModel(id);
    if (!before) throw new ResponsError(Code.NOT_FOUND, "role not found");
    
    if (before.is_system) throw new ResponsError(Code.FORBIDDEN, "cannot edit a system role");
    
    const exists = await findRoleByNameModel(name);
    if (exists && String(exists.id) !== id) throw new ResponsError(Code.CONFLICT, `role name ${name} already exists`);
    
    const updated = await updateRoleModel(id, name, description ?? null);
    
    return {
      userId: actorId,
      result: updated,
      beforeData: before,
      afterData: updated
    };
  }
);