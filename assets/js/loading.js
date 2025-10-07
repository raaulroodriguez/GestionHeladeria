// ========================
// CONFIGURACIÓN DEL LOADING
// ========================

const LOADING_CONFIG = {
  minDuration: 2000, // Mínimo 2.5 segundos
  maxDuration: 4000, // Máximo 4 segundos
  messages: [
    "Con amore, desde Italia...",
    "Tradición familiar italiana...",
    "Hecho con el corazón...",
    "Preparando experiencia única...",
  ],
};

// Variables globales
let loadingStartTime;
let currentMessageIndex = 0;
let messageInterval;

// ========================
// FUNCIONES PRINCIPALES
// ========================

/**
 * Inicia el sistema de loading
 */
function initLoading() {
  loadingStartTime = Date.now();
  currentMessageIndex = 0;

  // Iniciar rotación de mensajes
  startMessageRotation();

  // Simular carga de recursos
  simulateResourceLoading();
}

/**
 * Inicia la rotación de mensajes
 */
function startMessageRotation() {
  updateLoadingMessage();
  messageInterval = setInterval(updateLoadingMessage, 1000);
}

/**
 * Actualiza el mensaje del loading
 */
function updateLoadingMessage() {
  const loadingSubtitle = document.querySelector(".loading-subtitle");

  if (loadingSubtitle && LOADING_CONFIG.messages.length > 0) {
    loadingSubtitle.textContent = LOADING_CONFIG.messages[currentMessageIndex];
    currentMessageIndex =
      (currentMessageIndex + 1) % LOADING_CONFIG.messages.length;
  }
}

/**
 * Simula la carga de recursos
 */
function simulateResourceLoading() {
  const resources = [
    "assets/css/style.css",
    "assets/css/loading.css",
    "assets/img/corazon.png",
  ];

  let loadedResources = 0;
  const totalResources = resources.length;

  // Simular carga de cada recurso
  const loadPromises = resources.map(() => {
    return new Promise((resolve) => {
      setTimeout(() => {
        loadedResources++;
        resolve();
      }, Math.random() * 800 + 400);
    });
  });

  // Cuando todos los recursos estén cargados
  Promise.all(loadPromises).then(() => {
    const elapsedTime = Date.now() - loadingStartTime;
    const remainingTime = Math.max(0, LOADING_CONFIG.minDuration - elapsedTime);

    setTimeout(() => {
      hideLoading();
    }, remainingTime);
  });

  // Fallback: ocultar después del tiempo máximo
  setTimeout(() => {
    hideLoading();
  }, LOADING_CONFIG.maxDuration);
}

/**
 * Oculta el loading y muestra el contenido principal
 */
function hideLoading() {
  const loadingScreen = document.getElementById("loadingScreen");
  const mainContent = document.getElementById("mainContent");

  // Detener rotación de mensajes
  clearInterval(messageInterval);

  // Animación de salida
  loadingScreen.classList.add("fade-out");

  setTimeout(() => {
    loadingScreen.style.display = "none";
    mainContent.classList.add("show");

    // Animar entrada del contenido
    animateMainContent();
  }, 800);
}

/**
 * Anima la entrada del contenido principal
 */
function animateMainContent() {
  const cards = document.querySelectorAll(".menu-card");

  cards.forEach((card, index) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";

    setTimeout(() => {
      card.style.transition = "all 0.6s cubic-bezier(0.4, 0, 0.2, 1)";
      card.style.opacity = "1";
      card.style.transform = "translateY(0)";
    }, index * 150);
  });
}

/**
 * Muestra una notificación
 */
function showNotification(message, type = "info", duration = 3000) {
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
    word-wrap: break-word;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = "slideOutRight 0.3s ease";
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

// ========================
// INICIALIZACIÓN
// ========================

/**
 * Inicialización cuando el DOM está listo
 */
document.addEventListener("DOMContentLoaded", function () {
  // Iniciar el sistema de loading
  initLoading();
});

// ========================
// ESTILOS PARA NOTIFICACIONES
// ========================

// Agregar estilos CSS para notificaciones
const notificationStyles = document.createElement("style");
notificationStyles.textContent = `
  @keyframes slideInRight {
    from { 
      transform: translateX(100%); 
      opacity: 0; 
    }
    to { 
      transform: translateX(0); 
      opacity: 1; 
    }
  }
  
  @keyframes slideOutRight {
    from { 
      transform: translateX(0); 
      opacity: 1; 
    }
    to { 
      transform: translateX(100%); 
      opacity: 0; 
    }
  }
  
  @media (max-width: 768px) {
    .notification {
      right: 10px !important;
      max-width: calc(100vw - 40px) !important;
      font-size: 0.8rem !important;
    }
  }
`;
document.head.appendChild(notificationStyles);
