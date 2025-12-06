import { config } from "../configs";

export const cleanUnverified = async () => {
  try {
    console.log("cleanupUnverified running");

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    const result = await config.query(
      `DELETE FROM tb_user 
       WHERE is_verified = FALSE 
       AND source = 'email'
       AND created_at < $1`,
      [sevenDaysAgo]
    );

    console.log(`cleanupUnverified deleted : ${result.rowCount}`);
  } catch (err) {
    console.error("cleanupUnverified error :", err);
  }
};
