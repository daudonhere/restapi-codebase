import { Code, CodeMessage } from "./message-code";

export class ResponsError extends Error {
  public code: number;
  public description: string;

  constructor(code: Code, description?: string) {
    super(CodeMessage[code] || "unknown error");
    this.code = code;
    this.description = description || "no additional details";
    Object.setPrototypeOf(this, new.target.prototype);
  }
  toJSON() {
    return {
      result: null,
      code: this.code,
      message: this.message,
      description: this.description,
      timestamp: new Date().toISOString()
    };
  }
}