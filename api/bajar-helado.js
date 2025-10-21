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
  const { id } = req.body;

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

    if (producto.rows[0].cantidad <= 0) {
      return res
        .status(400)
        .json({ success: false, error: "Sin stock disponible" });
    }

    const result = await pool.query(
      "UPDATE inventario SET cantidad = cantidad - 1, consumido = consumido + 1, updated_at = NOW() WHERE id = $1 RETURNING *",
      [id]
    );

    await pool.query(
      "INSERT INTO historial (tipo, producto, cantidad, motivo) VALUES ($1, $2, $3, $4)",
      [
        "salida",
        `${producto.rows[0].tipo} - ${producto.rows[0].sabor}`,
        1,
        "Bajado a tienda",
      ]
    );

    // 🔔 NOTIFICACIÓN EN SEGUNDO PLANO
    enviarNotificacionAsync(
      "bajar",
      `${producto.rows[0].tipo} - ${producto.rows[0].sabor}`,
      1,
      result.rows[0].cantidad
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
