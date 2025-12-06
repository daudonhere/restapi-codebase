import { config } from "../../../configs";

export const deleteTokenModel = async (
  token: string,
  type: "refresh" | "verify" | "reset"
): Promise<void> => {
  await config.query("DELETE FROM tb_token WHERE token = $1 AND type = $2", [
    token,
    type,
  ]);
};

export const deleteTokenByUserAndTypeModel = async (
  userId: string,
  type: "refresh" | "verify" | "reset"
): Promise<void> => {
  await config.query("DELETE FROM tb_token WHERE user_id = $1 AND type = $2", [
    userId,
    type,
  ]);
};
