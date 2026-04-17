import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pg = require("pg");

const pool = new pg.Pool({ connectionString: "postgresql://postgres:postgres@localhost:5432/dating" });
const res = await pool.query(
  `SELECT table_schema, table_name FROM information_schema.tables
   WHERE table_name IN ('AdminUser', 'TimeSlot', 'Application')
   ORDER BY table_schema, table_name`
);
console.log("Tables found:", res.rows);

const res2 = await pool.query(`SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`);
console.log("Schemas:", res2.rows.map(r => r.schema_name));
await pool.end();
