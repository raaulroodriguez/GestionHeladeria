import { Pool } from "@neondatabase/serverless";

// Función de notificación NO BLOQUEANTE
function enviarNotificacionAsync(
  tipo,
  producto,
  cantidad,
  stockActual,
  motivo = ""
) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️ N8N_WEBHOOK_URL no configurada");
    return;
  }

  fetch(webhookUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tipo,
      producto,
      cantidad,
      stockActual,
      motivo,
      timestamp: new Date().toISOString(),
    }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("✅ Notificación enviada");
      } else {
        console.error("❌ Error notificación:", response.status);
      }
    })
    .catch((error) => {
      console.error("💥 Error:", error.message);
    });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { id, nuevaCantidad, motivo } = req.body;

  try {
    const producto = await pool.query(
      "SELECT * FROM inventario WHERE id = $1",
      [id]
    );

    if (producto.rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, error: "Producto no encontrado" });
    }

    const cantidadAnterior = producto.rows[0].cantidad;
    const diferencia = nuevaCantidad - cantidadAnterior;

    const result = await pool.query(
      "UPDATE inventario SET cantidad = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
      [nuevaCantidad, id]
    );

    const tipoMovimiento = diferencia >= 0 ? "ajuste+" : "ajuste-";
    await pool.query(
      "INSERT INTO historial (tipo, producto, cantidad, motivo) VALUES ($1, $2, $3, $4)",
      [
        tipoMovimiento,
        `${producto.rows[0].tipo} - ${producto.rows[0].sabor}`,
        Math.abs(diferencia),
        `Ajuste: ${motivo}`,
      ]
    );

    // 🔔 NOTIFICACIÓN EN SEGUNDO PLANO
    enviarNotificacionAsync(
      "ajustar",
      `${producto.rows[0].tipo} - ${producto.rows[0].sabor}`,
      diferencia,
      nuevaCantidad,
      motivo
    );

    // ⚡ RESPONDER INMEDIATAMENTE
    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("💥 ERROR:", error.message);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
}
