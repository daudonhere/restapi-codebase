import { config } from "../../../configs";

export const deleteRoleModel = async (id: string): Promise<void> => {
  await config.query(`DELETE FROM tb_role WHERE id = $1`, [id]);
};

export const deleteBulkRolesModel = async (roleIds: string[]): Promise<{ deletedIds: string[]; skipped: Array<{ id: string; reason: string }> }> => {
    const client = await config.connect();
    const skipped: Array<{ id: string; reason: string }> = [];
    const validToDelete: string[] = [];

    try {
      for (const id of roleIds) {
        const roleRes = await client.query("SELECT * FROM tb_role WHERE id = $1", [id]);
        const role = roleRes.rows[0];

        if (!role) {
          skipped.push({ id, reason: "not_found" });
          continue;
        }

        if (role.is_system) {
          skipped.push({ id, reason: "is_system" });
          continue;
        }

        const users = await client.query(
          `SELECT user_id FROM tb_user_role WHERE role_id = $1 LIMIT 1`,
          [id]
        );

        if ((users?.rowCount ?? 0) > 0) {
          skipped.push({ id, reason: "in_use" });
          continue;
        }
        
        validToDelete.push(id);
      }

      const deletedIds: string[] = [];
      
      if (validToDelete.length > 0) {
        await client.query("BEGIN");
        for (const id of validToDelete) {
           const res = await client.query(
            `DELETE FROM tb_role WHERE id = $1 RETURNING id`,
            [id]
          );
          if (res.rowCount) deletedIds.push(res.rows[0].id);
        }
        await client.query("COMMIT");
      }

      return { deletedIds, skipped };
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
};