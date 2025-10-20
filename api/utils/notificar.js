export async function enviarNotificacion(
  tipo,
  producto,
  cantidad,
  stockActual,
  motivo = ""
) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("N8N_WEBHOOK_URL no configurada, omitiendo notificación");
    return;
  }

  try {
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

    if (!response.ok) {
      console.error("Error al enviar notificación:", await response.text());
    }
  } catch (error) {
    console.error("Error en notificación Telegram:", error);
  }
}
