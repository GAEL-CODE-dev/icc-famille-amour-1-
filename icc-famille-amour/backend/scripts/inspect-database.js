import { pool } from "../src/config/db.js";

try {
  const { rows } = await pool.query(`
    SELECT
      current_database() AS database,
      to_regclass('public.schema_migrations') IS NOT NULL AS migration_table_exists,
      to_regclass('public.members') IS NOT NULL AS members_table_exists,
      to_regclass('public.admins') IS NOT NULL AS admins_table_exists,
      to_regclass('public.cash_transactions') IS NOT NULL AS cash_table_exists,
      to_regclass('public.activities') IS NOT NULL AS activities_table_exists,
      to_regclass('public.prayer_programs') IS NOT NULL AS prayer_programs_table_exists,
      to_regtype('public.admin_role') IS NOT NULL AS admin_role_exists,
      to_regtype('public.cash_type') IS NOT NULL AS cash_type_exists,
      to_regtype('public.activity_status') IS NOT NULL AS activity_status_exists,
      to_regtype('public.backup_type') IS NOT NULL AS backup_type_exists,
      to_regtype('public.backup_status') IS NOT NULL AS backup_status_exists
  `);

  const schema = rows[0];
  if (schema.migration_table_exists) {
    const migrations = await pool.query(
      "SELECT filename FROM public.schema_migrations ORDER BY filename"
    );
    schema.applied_migrations = migrations.rows.map((row) => row.filename);
  } else {
    schema.applied_migrations = [];
  }

  console.log(JSON.stringify(schema, null, 2));
} catch (error) {
  console.error("Lecture du schéma impossible :", error.code || "DATABASE_ERROR");
  process.exitCode = 1;
} finally {
  await pool.end();
}