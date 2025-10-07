import { getDB } from "../lib/db";

export default async function handler(req, res) {
  const sql = getDB();

  try {
    const rows = await sql`SELECT * FROM inventario ORDER BY tipo, sabor`;

    // Caché HTTP
    res.setHeader("Cache-Control", "s-maxage=10, stale-while-revalidate");
    res.status(200).json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
