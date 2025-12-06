import { config } from "../../../configs";
import { QueryResult } from "pg";
import { UserInterface } from "../../../interfaces/user-interface";

export const createUserModel = async (
  email: string,
  password: string,
  fullname: string,
  source: "email" | "google" | "github",
  ip_address: string | null,
  user_agent: string | null
): Promise<UserInterface> => {
  const client = await config.connect();
  try {
    await client.query("BEGIN");
    const userResult: QueryResult = await client.query(
      `
      INSERT INTO tb_user (email, password, fullname, source, ip_address, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [email, password, fullname, source, ip_address, user_agent]
    );

    const user = userResult.rows[0];
    const roleResult: QueryResult = await client.query(
      "SELECT id FROM tb_role WHERE name = 'user' LIMIT 1"
    );
    
    if (roleResult.rowCount === 0) {
        throw new Error("Default role 'user' not found in database");
    }

    const userRoleId = roleResult.rows[0].id;
    await client.query(
      `INSERT INTO tb_user_role (user_id, role_id) VALUES ($1, $2)`,
      [user.id, userRoleId]
    );
    await client.query("COMMIT");
    return user;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const restoreUserByIdModel = async (id: string): Promise<UserInterface | null> => {
  const result = await config.query(
    `
    UPDATE tb_user
    SET 
      is_delete = FALSE,
      deleted_at = NULL,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *;
    `,
    [id]
  );
  return result.rows[0] || null;
};

export const setUserAsVerifiedModel = async (userId: string): Promise<void> => {
  await config.query(
    "UPDATE tb_user SET is_verified = TRUE, updated_at = NOW() WHERE id = $1",
    [userId]
  );
};