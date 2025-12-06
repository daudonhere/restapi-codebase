import { Response } from "express";
import { Code, CodeMessage } from "./message-code";

export const ResponsSuccess = (
  res: Response,
  code: Code,
  description: string,
  result: any = null
) => {
  return res.status(code).json({
    result: result,
    code: code,
    message: CodeMessage[code] || "unknown code",
    description: description,
    timestamp: new Date().toISOString()
  });
};