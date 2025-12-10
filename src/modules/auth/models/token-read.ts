import { config } from "../../../configs";

export const findTokenModel = async (
  token: string,
  type: "refresh" | "verify" | "reset"
) => {
  const result = await config.query(
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