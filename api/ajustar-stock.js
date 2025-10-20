import { Pool } from "@neondatabase/serverless";

// Función de notificación inline CON LOGS
async function enviarNotificacion(
  tipo,
  producto,
  cantidad,
  stockActual,
  motivo = ""
) {
  console.log("🔔 === INICIO NOTIFICACIÓN ===");

  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  console.log("Webhook URL configurada:", webhookUrl ? "✅ SÍ" : "❌ NO");
  console.log("URL completa:", webhookUrl || "No definida");

  if (!webhookUrl) {
    console.warn("⚠️ N8N_WEBHOOK_URL no configurada, omitiendo notificación");
    return;
  }

  try {
    console.log("📤 Enviando notificación...");
    console.log("Datos:", { tipo, producto, cantidad, stockActual, motivo });

    const response = await fetch(webhookUrl, {
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
    });

    console.log("📥 Respuesta webhook status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Error al enviar notificación:", errorText);
    } else {
      console.log("✅ Notificación enviada correctamente");
    }
  } catch (error) {
    console.error("💥 Error en notificación Telegram:", error.message);
    console.error("Stack:", error.stack);
  }

  console.log("🔔 === FIN NOTIFICACIÓN ===");
}

export default async function handler(req, res) {
  console.log("🚀 === INICIO API ajustar-stock ===");

  if (req.method !== "POST") {
    console.log("❌ Método no permitido:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { id, nuevaCantidad, motivo } = req.body;

  console.log("📦 Datos recibidos:", { id, nuevaCantidad, motivo });

  try {
    const producto = await pool.query(
      "SELECT * FROM inventario WHERE id = $1",
      [id]
    );

    if (producto.rows.length === 0) {
      console.log("❌ Producto no encontrado");
      return res
        .status(404)
        .json({ success: false, error: "Producto no encontrado" });
    }

    console.log("✅ Producto encontrado:", producto.rows[0].sabor);

    const cantidadAnterior = producto.rows[0].cantidad;
    const diferencia = nuevaCantidad - cantidadAnterior;

    console.log("🔢 Cantidad anterior:", cantidadAnterior);
    console.log("🔢 Nueva cantidad:", nuevaCantidad);
    console.log("🔢 Diferencia:", diferencia);

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

    console.log("✅ Stock ajustado, enviando notificación...");

    // 🔔 NOTIFICACIÓN TELEGRAM
    await enviarNotificacion(
      "ajustar",
      `${producto.rows[0].tipo} - ${producto.rows[0].sabor}`,
      diferencia,
      nuevaCantidad,
      motivo
    );

    console.log("🚀 === FIN API ajustar-stock ===");

    res.status(200).json({ success: true, data: result.rows[0] });
  } catch (error) {
    console.error("💥 ERROR GENERAL:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
}
