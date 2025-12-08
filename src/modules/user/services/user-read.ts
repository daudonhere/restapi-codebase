import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { UserInterface } from "../../../interfaces/user-interface";
import { findAllUsersModel, findUserByIdModel, countAllUsersModel } from "../models/user-read";
import { getPagination, buildMeta } from "../../../utils/pagination";

export const findAllUsersService = async (page: number, limit: number) => {
  const totalData = await countAllUsersModel();
  const { offset } = getPagination(page, limit);
  const users = await findAllUsersModel(limit, offset);
  return { users, meta: buildMeta(page, limit, totalData) };
};

export const findUserByIdService = async (id: string): Promise<UserInterface> => {
  const user = await findUserByIdModel(id);
  if (!user) throw new ResponsError(Code.NOT_FOUND, "user not found");
  return user;
};