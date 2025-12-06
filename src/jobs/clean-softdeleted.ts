import { config } from "../configs";

export const cleanSoftDeleted = async () => {
  try {
    console.log("cleanupSoftDeleted running");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const result = await config.query(
      `DELETE FROM tb_user 
       WHERE is_delete = TRUE 
       AND deleted_at < $1`,
      [sevenDaysAgo]
    );

    console.log(`cleanupSoftDeleted deleted: ${result.rowCount}`);
  } catch (err) {
    console.error("cleanupSoftDeleted error:", err);
  }
};

cleanSoftDeleted()
  .then(() => {
    console.log("cleanup soft-deleted completed");
    process.exit(0);
  })
  .catch((err) => {
    console.error("failed to cleanup soft-deleted cause", err);
    process.exit(1);
  });
