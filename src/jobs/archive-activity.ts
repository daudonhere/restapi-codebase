import fs from "fs";
import path from "path";
import { config } from "../configs";

export const archiveActivity = async () => {
  console.log("archiveActivity running");

  const storageDir = path.join(process.cwd(), "storage", "logs");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const client = await config.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(
      `SELECT * FROM tb_activity ORDER BY created_at ASC`
    );

    if (result.rowCount === 0) {
      console.log("archiveActivity no logs found");
      await client.query("ROLLBACK");
      client.release();
      return;
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `activity_${timestamp}.json`;
    const filePath = path.join(storageDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));

    const ids = result.rows.map((r) => r.id);

    await client.query(
      `DELETE FROM tb_activity WHERE id = ANY($1::uuid[])`,
      [ids]
    );

    await client.query("COMMIT");

    console.log(`archiveActivity archived: ${fileName}`);

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("archiveActivity error:", err);
  } finally {
    client.release();
  }
};
