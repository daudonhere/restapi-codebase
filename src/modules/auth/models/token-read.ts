import { config } from "../../../configs";

export const findTokenModel = async (
  token: string,
  type: "refresh" | "verify" | "reset"
) => {
  const result = await config.query(
    "SELECT * FROM tb_token WHERE token = $1 AND type = $2",
    [token, type]
  );
  return result.rows[0] || null;
};