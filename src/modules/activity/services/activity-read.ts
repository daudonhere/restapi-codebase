import {
  countActivityLogModel,
  findActivityLogModel,
  findActivityLogByIdModel
} from "../models/activity-read";
import { getPagination, buildMeta } from "../../../utils/pagination";
import { ResponsError } from "../../../constants/respons-error";
import { Code } from "../../../constants/message-code";
import { ActivityLogInterface, ActivityFilterInterface } from "../../../interfaces/activity-interface";

export const getActivityLogService = async (
  pageQuery?: string,
  limitQuery?: string,
  filters?: ActivityFilterInterface
) => {
  const appliedFilters: ActivityFilterInterface = {
    module: filters?.module,
    action: filters?.action,
    userId: filters?.userId,
    status: filters?.status,
    dateFrom: filters?.dateFrom,
    dateTo: filters?.dateTo,
  };

  const totalData = await countActivityLogModel(appliedFilters);
  const { page, limit, offset } = getPagination(pageQuery, limitQuery, totalData);
  const logs = await findActivityLogModel(limit, offset, appliedFilters);
  const meta = buildMeta(page, limit, totalData);

  return { logs, meta };
};

export const getActivityLogByIdService = async (
  id: string
): Promise<ActivityLogInterface> => {
  const log = await findActivityLogByIdModel(id);
  if (!log) {
    throw new ResponsError(Code.NOT_FOUND, "activity log not found");
  }
  return log;
};
