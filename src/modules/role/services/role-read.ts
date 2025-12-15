import {
  findAllRolesModel,
  findRoleByIdModel,
  countAllRolesModel,
} from "../models/role-read";
import { buildMeta, getPagination } from "../../../utils/pagination";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { Role, RoleIdSchema } from "../schema/role-schema";

export const getAllRolesService = async (
  pageQuery?: string,
  limitQuery?: string
): Promise<{ roles: Role[]; meta: any }> => {
  const total = await countAllRolesModel();
  const { page, limit, offset } = getPagination(
    pageQuery,
    limitQuery,
    total
  );
  const roles = await findAllRolesModel(limit, offset);
  return { roles, meta: buildMeta(page, limit, total) };
};

export const getRoleByIdService = async (id: string): Promise<Role> => {
  RoleIdSchema.parse({ id });

  const role = await findRoleByIdModel(id);
  if (!role) {
    throw new ResponsError(Code.NOT_FOUND, "role not found");
  }

  return role;
};
