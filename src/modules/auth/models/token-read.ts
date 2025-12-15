import { config } from "../../../configs";

export interface TokenRecord {
  id: string;
  user_id: string;
  token: string;
  type: "refresh" | "verify" | "reset";
  created_at: Date;
  expired_at: Date;
}

export const findTokenModel = async (
  token: string,
  type: "refresh" | "verify" | "reset"
): Promise<TokenRecord | null> => {
  const result = await config.query<TokenRecord>(
    `
    SELECT 
      id,
      user_id,
      token,
      type,
      created_at,
      expired_at
    FROM tb_token
    WHERE token = $1 AND type = $2
    LIMIT 1
    `,
    [token.trim(), type]
  );

  return result.rows[0] || null;
};
