import { config } from "../../../configs";

export const saveTokenModel = async (
  userId: string,
  token: string,
  type: "refresh" | "verify" | "reset",
  expiresAt: Date
): Promise<void> => {
  await config.query(
    `
    INSERT INTO tb_token (user_id, token, type, expired_at)
    VALUES ($1, $2, $3, $4)
    `,
    [userId, token.trim(), type, expiresAt]
  );
};