// =========================
// SCRIPT PARA INDEX.HTML
// =========================

document.addEventListener("DOMContentLoaded", function () {
  console.log("Gelateria Di Amore - Sistema cargado correctamente");

  // Aquí puedes agregar funcionalidad adicional para el menú principal
  // Por ejemplo, animaciones extras, validaciones, etc.

  // Ejemplo: Agregar efecto hover mejorado a las cards
  const menuCards = document.querySelectorAll(".menu-card");

  menuCards.forEach((card) => {
    card.addEventListener("mouseenter", function () {
      this.style.transform = "translateY(-12px) scale(1.02)";
    });

    card.addEventListener("mouseleave", function () {
      this.style.transform = "translateY(0) scale(1)";
    });
  });
});

// Función para mostrar notificaciones (si necesitas)
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${
      type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#2196f3"
    };
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    z-index: 10001;
    animation: slideInRight 0.3s ease;
    box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    font-weight: 500;
    font-family: 'Rubik', sans-serif;
    max-width: 300px;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}
