import { Pool } from "@neondatabase/serverless";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { tipo, sabor, cantidad } = req.body;

  try {
    // Verificar si existe
    const checkQuery =
      "SELECT * FROM inventario WHERE tipo = $1 AND LOWER(sabor) = LOWER($2)";
    const check = await pool.query(checkQuery, [tipo, sabor]);

    if (check.rows.length > 0) {
      // Actualizar cantidad
      const updateQuery =
        "UPDATE inventario SET cantidad = cantidad + $1, updated_at = NOW() WHERE id = $2 RETURNING *";
      const result = await pool.query(updateQuery, [
        cantidad,
        check.rows[0].id,
      ]);

      // Registrar en historial
      await pool.query(
        "INSERT INTO historial (tipo, producto, cantidad, motivo) VALUES ($1, $2, $3, $4)",
        ["entrada", `${tipo} - ${sabor}`, cantidad, "Elaborado"]
      );

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: "Stock actualizado",
      });
    } else {
      // Crear nuevo
      const insertQuery =
        "INSERT INTO inventario (tipo, sabor, cantidad, stock_min, consumido) VALUES ($1, $2, $3, 2, 0) RETURNING *";
      const result = await pool.query(insertQuery, [tipo, sabor, cantidad]);

      // Registrar en historial
      await pool.query(
        "INSERT INTO historial (tipo, producto, cantidad, motivo) VALUES ($1, $2, $3, $4)",
        ["entrada", `${tipo} - ${sabor}`, cantidad, "Elaborado"]
      );

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Helado creado",
      });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
}
