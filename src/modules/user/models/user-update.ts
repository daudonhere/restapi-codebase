import { config } from "../../../configs";
import { User } from "../schema/user-schema";

export const updateLastLoginModel = async (id: unknown): Promise<void> => {
  await config.query(
    `
    UPDATE tb_user
    SET login_at = NOW(),
        updated_at = NOW()
    WHERE id = $1
    `,
    [id]
  );
};

export const updateUserByIdModel = async (
  id: unknown,
  payload: {
    fullname: string | null;
    phone: string | null;
    email: string | null;
    resetVerification: boolean;
  }
): Promise<User> => {
  const result = await config.query<User>(
    `
    UPDATE tb_user
    SET
      fullname = $1,
      phone = $2,
      email = COALESCE($3, email),
      is_verified = CASE WHEN $4 THEN FALSE ELSE is_verified END,
      updated_at = NOW()
    WHERE id = $5
    RETURNING *
    `,
    [
      payload.fullname,
      payload.phone,
      payload.email,
      payload.resetVerification,
      id,
    ]
  );

  return result.rows[0];
};

export const updateUserCredentialModel = async (
  id: unknown,
  data: Record<string, any>
): Promise<string> => {
  const fields = [];
  const values = [];
  let idx = 1;

  for (const key of Object.keys(data)) {
    fields.push(`${key} = $${idx++}`);
    values.push(data[key]);
  }

  const result = await config.query(
    `
    UPDATE tb_user
    SET ${fields.join(", ")},
        updated_at = NOW()
    WHERE id = $${idx}
    RETURNING id
    `,
    [...values, id]
  );

  return result.rows[0].id;
};

export const updateUserRolesModel = async (
  id: unknown,
  roles: string[]
): Promise<void> => {
  const client = await config.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `DELETE FROM tb_user_role WHERE user_id = $1`,
      [id]
    );

    for (const role of roles) {
      const res = await client.query(
        `SELECT id FROM tb_role WHERE name = $1 LIMIT 1`,
        [role]
      );
      if (res.rowCount) {
        await client.query(
          `INSERT INTO tb_user_role (user_id, role_id) VALUES ($1, $2)`,
          [id, res.rows[0].id]
        );
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};

export const updateUserAvatarModel = async (
  id: unknown,
  avatar: string
): Promise<User> => {
  const result = await config.query<User>(
    `
    UPDATE tb_user
    SET avatar = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [avatar, id]
  );

  return result.rows[0];
};
