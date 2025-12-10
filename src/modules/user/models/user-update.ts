import { config } from "../../../configs";
import { Code } from "../../../constants/message-code";
import { ResponsError } from "../../../constants/respons-error";

export const updateUserAvatarModel = async (
  id: string,
  avatarUrl: string
) => {
  const result = await config.query(
    `
    UPDATE tb_user
    SET 
      avatar = $1,
      updated_at = NOW()
    WHERE id = $2
    RETURNING *
    `,
    [avatarUrl, id]
  );

  return result.rows[0] || null;
};

export const updateUserCredentialModel = async (
  id: string,
  data: Record<string, any>
): Promise<string> => {
  const client = await config.connect();

  try {
    await client.query("BEGIN");

    const { pin, frequency, code, password } = data;

    const result = await client.query(
      `
      UPDATE tb_user
      SET 
        pin        = COALESCE($1, pin),
        frequency  = COALESCE($2, frequency),
        code       = COALESCE($3, code),
        password   = COALESCE($4, password),
        is_verified = FALSE,
        updated_at = NOW()
      WHERE id = $5
      RETURNING id
      `,
      [pin, frequency, code, password, id]
    );

    if (result.rowCount === 0) {
      throw new Error("User not found");
    }

    await client.query("COMMIT");
    return result.rows[0].id;

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
};

export const updateUserByIdModel = async (
  id: string,
  data: Record<string, any>
) => {
  const client = await config.connect();

  try {
    await client.query("BEGIN");

    const { fullname, email, phone, resetVerification } = data;

    const result = await client.query(
      `
      UPDATE tb_user
      SET 
        fullname   = COALESCE($1, fullname),
        email      = COALESCE($2, email),
        phone      = COALESCE($3, phone),
        is_verified = CASE 
            WHEN $4 = TRUE THEN FALSE 
            ELSE is_verified 
        END,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [fullname, email, phone, resetVerification, id]
    );

    if (result.rowCount === 0) {
      throw new Error("User not found");
    }

    await client.query("COMMIT");
    return result.rows[0];

  } catch (err) {
    await client.query("ROLLBACK");
    throw err;

  } finally {
    client.release();
  }
};

export const updateLastLoginModel = async (
  id: string
): Promise<void> => {
  await config.query(
    `
    UPDATE tb_user
    SET 
      login_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
    `,
    [id]
  );
};

export const updateUserRolesModel = async (
  id: string,
  roles: string[]
): Promise<void> => {
  const client = await config.connect();

  try {
    await client.query("BEGIN");

    const roleNamesRes = await client.query(
      `
      SELECT name 
      FROM tb_role 
      WHERE name = ANY($1::varchar[])
      `,
      [roles]
    );

    const validRoles = roleNamesRes.rows.map((r) => r.name);
    const invalidRoles = roles.filter((r) => !validRoles.includes(r));

    if (invalidRoles.length > 0) {
      throw new ResponsError(
        Code.BAD_REQUEST,
        `invalid roles: ${invalidRoles.join(", ")}`
      );
    }

    await client.query(
      `
      DELETE FROM tb_user_role 
      WHERE user_id = $1
      `,
      [id]
    );

    if (validRoles.length > 0) {
      await client.query(
        `
        INSERT INTO tb_user_role (user_id, role_id)
        SELECT $1, id
        FROM tb_role 
        WHERE name = ANY($2::varchar[])
        `,
        [id, validRoles]
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