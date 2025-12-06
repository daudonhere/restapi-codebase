const CREDENTIAL_HIDDEN_FIELDS = [
  "password",
  "frequency",
  "code",
  "pin",
  "passphrase"
];

export const sanitizeCredential = (user: any, hidden: string[] = CREDENTIAL_HIDDEN_FIELDS) => {
  const sanitized = { ...user };
  hidden.forEach(field => delete sanitized[field]);
  return sanitized;
};

const USER_HIDDEN_FIELDS = [
  "password",
  "frequency",
  "code",
  "pin",
  "passphrase",
  "is_verified",
  "login_at",
  "ip_address",
  "user_agent",
  "created_at",
  "updated_at",
  "is_delete",
  "deleted_at",
];

export const sanitizeUser = (user: any, hidden: string[] = USER_HIDDEN_FIELDS) => {
  const sanitized = { ...user };
  hidden.forEach(field => delete sanitized[field]);
  return sanitized;
};

const LOG_HIDDEN_FIELDS = [
  "module",
  "endpoint",
  "method",
  "status_code",
  "ip_address",
  "user_agent",
  "before_data",
  "after_data",
];

export const sanitizeLog = (logs: any, hidden: string[] = LOG_HIDDEN_FIELDS) => {
  const sanitized = { ...logs };
  hidden.forEach(field => delete sanitized[field]);
  return sanitized;
};

const LOGIN_HIDDEN_FIELDS = [
  "avatar",
  "phone",
  "password",
  "frequency",
  "code",
  "pin",
  "passphrase",
  "ip_address",
  "user_agent",
  "is_verified",
  "created_at",
  "updated_at",
  "is_delete",
  "deleted_at",
  "roles",
];

export const sanitizeLogin = (user: any, hidden: string[] = LOGIN_HIDDEN_FIELDS) => {
  const sanitized = { ...user };
  hidden.forEach(field => delete sanitized[field]);
  return sanitized;
};