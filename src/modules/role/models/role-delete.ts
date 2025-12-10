import { config } from "../../../configs";

export const deleteRoleModel = async (id: string): Promise<void> => {
  await config.query(`DELETE FROM tb_role WHERE id = $1`, [id]);
};

export const deleteBulkRolesModel = async (
  roleIds: string[]
): Promise<{ deletedIds: string[]; skipped: Array<{ id: string; reason: string }> }> => {
  const client = await config.connect();
  const skipped: Array<{ id: string; reason: string }> = [];

  try {
    const rolesRes = await client.query(
      `
      SELECT 
        r.id,
        r.is_system,
        EXISTS (
          SELECT 1 FROM tb_user_role ur 
          WHERE ur.role_id = r.id
          LIMIT 1
        ) AS in_use
      FROM tb_role r
      WHERE r.id = ANY($1::uuid[])
      `,
      [roleIds]
    );

    if (rolesRes.rowCount === 0) {
      return { deletedIds: [], skipped: roleIds.map(id => ({ id, reason: "not_found" })) };
    }

    const validToDelete: string[] = [];

    for (const roleId of roleIds) {
      const role = rolesRes.rows.find((x) => x.id === roleId);

      if (!role) {
        skipped.push({ id: roleId, reason: "not_found" });
        continue;
      }

      if (role.is_system) {
        skipped.push({ id: roleId, reason: "is_system" });
        continue;
      }

      if (role.in_use) {
        skipped.push({ id: roleId, reason: "in_use" });
        continue;
      }

      validToDelete.push(roleId);
    }

    const deletedIds: string[] = [];

    if (validToDelete.length > 0) {
      await client.query("BEGIN");
      const res = await client.query(
        `
        DELETE FROM tb_role 
        WHERE id = ANY($1::uuid[])
        RETURNING id
        `,
        [validToDelete]
      );
      await client.query("COMMIT");

      deletedIds.push(...res.rows.map((r) => r.id));
    }

    return { deletedIds, skipped };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
};
