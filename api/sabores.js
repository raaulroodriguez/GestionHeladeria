import { Pool } from "@neondatabase/serverless";

export default async function handler(req, res) {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { tipo } = req.query;

    let query = "SELECT DISTINCT sabor FROM inventario";
    let params = [];

    if (tipo) {
      query += " WHERE tipo = $1";
      params.push(tipo);
    }

    query += " ORDER BY sabor";

    const { rows } = await pool.query(query, params);

    res.status(200).json({
      success: true,
      data: rows.map(row => row.sabor)
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
}
