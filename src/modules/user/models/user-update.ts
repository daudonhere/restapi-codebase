import { config } from "../../../configs";
import { Code } from "../../../constants/message-code";
import { ResponsError } from "../../../constants/respons-error";

export const updateUserByIdModel = async (
  id: string,
  data: Record<string, any>
): Promise<string> => {
  const client = await config.connect();
  try {
    await client.query("BEGIN");
    const {
      fullname,
      avatar,
      phone,
      pin,
      frequency,
      code,
      passphrase,
      source,
      is_verified,
      login_at,
      password,
      ip_address,
      user_agent,
      is_delete
    } = data;
    const deleted_at = is_delete ? new Date() : null;
    const userResult = await client.query(
      `
      UPDATE tb_user
      SET 
        fullname = COALESCE($1, fullname),
        avatar = COALESCE($2, avatar),
        phone = COALESCE($3, phone),
        pin = COALESCE($4, pin),
        frequency = COALESCE($5, frequency),
        code = COALESCE($6, code),
        passphrase = COALESCE($7, passphrase),
        source = COALESCE($8, source),
        is_verified = COALESCE($9, is_verified),
        login_at = COALESCE($10, login_at),
        password = COALESCE($11, password),
        ip_address = COALESCE($12, ip_address),
        user_agent = COALESCE($13, user_agent),
        is_delete = COALESCE($14, is_delete),
        deleted_at = COALESCE($15, deleted_at),
        updated_at = NOW()
      WHERE id = $16
      RETURNING id
      `,
      [
        fullname,
        avatar,
        phone,
        pin,
        frequency,
        code,
        passphrase,
        source,
        is_verified,
        login_at,
        password,
        ip_address,
        user_agent,
        is_delete,
        deleted_at,
        id
      ]
    );

    if (userResult.rowCount === 0) {
      throw new Error("User not found");
    }
    await client.query("COMMIT");
    return userResult.rows[0].id;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
};

export const updateLastLoginModel = async (userId: string): Promise<void> => {
  await config.query(
    "UPDATE tb_user SET login_at = NOW(), updated_at = NOW() WHERE id = $1",
    [userId]
  );
};

export const updateUserRolesModel = async (id: string, roles: string[]): Promise<void> => {
    const client = await config.connect();
    try {
      await client.query("BEGIN");
      const roleNamesRes = await client.query(
        `SELECT name FROM tb_role WHERE name = ANY($1::varchar[])`,
        [roles]
      );
      const valid = roleNamesRes.rows.map((r) => r.name);
      const invalid = roles.filter((r) => !valid.includes(r));
      if (invalid.length > 0)
        throw new ResponsError(
          Code.BAD_REQUEST,
          `invalid roles: ${invalid.join(", ")}`
        );

      await client.query(`DELETE FROM tb_user_role WHERE user_id = $1`, [id]);

      if (valid.length > 0) {
        await client.query(
          `
            INSERT INTO tb_user_role (user_id, role_id)
            SELECT $1, id FROM tb_role WHERE name = ANY($2::varchar[])
          `,
          [id, valid]
        );
      }
      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
};
