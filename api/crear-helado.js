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
  console.log("🚀 === INICIO API crear-helado ===");

  if (req.method !== "POST") {
    console.log("❌ Método no permitido:", req.method);
    return res.status(405).json({ error: "Method not allowed" });
  }

  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const { tipo, sabor, cantidad } = req.body;

  console.log("📦 Datos recibidos:", { tipo, sabor, cantidad });

  try {
    // Verificar si existe
    const checkQuery =
      "SELECT * FROM inventario WHERE tipo = $1 AND LOWER(sabor) = LOWER($2)";
    const check = await pool.query(checkQuery, [tipo, sabor]);

    if (check.rows.length > 0) {
      console.log("🔄 Producto existe, actualizando...");

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

      console.log("✅ Producto actualizado, enviando notificación...");

      // 🔔 NOTIFICACIÓN TELEGRAM
      await enviarNotificacion(
        "crear",
        `${tipo} - ${sabor}`,
        cantidad,
        result.rows[0].cantidad
      );

      console.log("🚀 === FIN API crear-helado (UPDATE) ===");

      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: "Stock actualizado",
      });
    } else {
      console.log("➕ Producto nuevo, creando...");

      // Crear nuevo
      const insertQuery =
        "INSERT INTO inventario (tipo, sabor, cantidad, stock_min, consumido) VALUES ($1, $2, $3, 2, 0) RETURNING *";
      const result = await pool.query(insertQuery, [tipo, sabor, cantidad]);

      // Registrar en historial
      await pool.query(
        "INSERT INTO historial (tipo, producto, cantidad, motivo) VALUES ($1, $2, $3, $4)",
        ["entrada", `${tipo} - ${sabor}`, cantidad, "Elaborado"]
      );

      console.log("✅ Producto creado, enviando notificación...");

      // 🔔 NOTIFICACIÓN TELEGRAM
      await enviarNotificacion(
        "crear",
        `${tipo} - ${sabor}`,
        cantidad,
        result.rows[0].cantidad
      );

      console.log("🚀 === FIN API crear-helado (CREATE) ===");

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: "Helado creado",
      });
    }
  } catch (error) {
    console.error("💥 ERROR GENERAL:", error.message);
    console.error("Stack:", error.stack);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    await pool.end();
  }
}
