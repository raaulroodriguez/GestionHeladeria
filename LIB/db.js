import { neon } from "@neondatabase/serverless";

let sql;

export function getDB() {
  if (!sql) {
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}
