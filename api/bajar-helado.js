import { Pool } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { id } = req.body;

  try {
    // Obtener producto
    const producto = await pool.query(
      "SELECT * FROM inventario WHERE id = $1",
      [id]
    );

    if (producto.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Producto no encontrado" });
    }

    if (producto.rows[0].cantidad <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Sin stock disponible" });
    }

    // Reducir cantidad
    const result = await pool.query(
      "UPDATE inventario SET cantidad = cantidad - 1, consumido = consumido + 1, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    // Registrar en historial
    await pool.query(
      "INSERT INTO historial (tipo, producto, cantidad, motivo) VALUES ($1, $2, $3, $4)",
      [
        "salida",
        `${producto.rows[0].tipo} - ${producto.rows[0].sabor}`,
        1,
        "Bajado a tienda",
      ]
    );

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
}
