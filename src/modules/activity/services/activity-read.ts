import {
  countActivityLogModel,
  findActivityLogModel,
  findActivityLogByIdModel,
} from "../models/activity-read";
import { getPagination, buildMeta } from "../../../utils/pagination";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { ActivityFilterSchema } from "../schema/activity-schema";

export const getActivityLogService = async (
  pageQuery?: string,
  limitQuery?: string,
  filters?: unknown
) => {
  const parsedFilters = ActivityFilterSchema.parse(filters ?? {});

  const totalData = await countActivityLogModel(parsedFilters);
  const { page, limit, offset } = getPagination(pageQuery, limitQuery, totalData);
  const logs = await findActivityLogModel(limit, offset, parsedFilters);
  const meta = buildMeta(page, limit, totalData);

  return { logs, meta };
};

export const getActivityLogByIdService = async (id: string) => {
  const log = await findActivityLogByIdModel(id);
  if (!log) {
    throw new ResponsError(Code.NOT_FOUND, "activity log not found");
  }
  return log;
};