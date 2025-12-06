export interface BaseLogParamsInterface {
  module: string;
  action: string;
  userId?: string | null;
  context: ActivityContextInterface;
  beforeData?: any;
  description?: string;
}

export interface LogSuccessParamsInterface extends BaseLogParamsInterface {
  status?: "success";
  statusCode?: number;
  afterData?: any;
}

export interface LogErrorParamsInterface extends BaseLogParamsInterface {
  status?: "error";
  error: unknown;
}

export interface ActivityContextInterface {
  endpoint: string;
  method: string;
  ip: string | null;
  userAgent: string | null;
}

export interface ActivityLogInterface {
  id: string;
  user_id: string | null;
  module: string;
  action: string;
  endpoint: string;
  method: string;
  status_code: number;
  status: "success" | "error" | string;
  ip_address: string | null;
  user_agent: string | null;
  before_data: any | null;
  after_data: any | null;
  description: string | null;
  created_at: Date;
}
export interface ActivityFilterInterface {
  module?: string;
  action?: string;
  userId?: string;
  status?: "success" | "error" | string;
  dateFrom?: string;
  dateTo?: string;
}

export interface ActivityLogPayloadInterface {
  userId: string | null;
  module: string;
  action: string;
  endpoint: string;
  method: string;
  status: "success" | "error";
  statusCode: number;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeData?: any;
  afterData?: any;
  description?: string | null;
}
