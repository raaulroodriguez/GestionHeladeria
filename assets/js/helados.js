// =========================
// CONFIGURACIÓN API
// =========================

const API_BASE = "/api";

// Variables locales para caché (opcional)
let inventarioCache = [];
let historialCache = [];

// =========================
// NAVEGACIÓN ENTRE VISTAS
// =========================

function showMenu() {
  document.getElementById("main-menu").style.display = "block";
  document.querySelectorAll(".current-view").forEach((v) => {
    v.classList.remove("active");
  });
}

function showView(viewId) {
  document.getElementById("main-menu").style.display = "none";
  document.querySelectorAll(".current-view").forEach((v) => {
    v.classList.remove("active");
  });

  const view = document.getElementById(viewId);
  view.classList.add("active");

  // Cargar datos según vista
  switch (viewId) {
    case "bajar":
      cargarProductos("producto-bajar");
      break;
    case "inventario":
      mostrarInventario();
      break;
    case "por-tipo":
      filtrarTipo();
      break;
    case "alertas":
      mostrarAlertas();
      break;
    case "historial":
      mostrarHistorial();
      break;
    case "ajustar":
      cargarProductos("producto-ajustar");
      break;
    case "ranking":
      mostrarRanking();
      break;
  }
}

// =========================
// FUNCIONES API
// =========================

async function fetchInventario() {
  try {
    const response = await fetch(`${API_BASE}/inventario`);
    const data = await response.json();
    if (data.success) {
      inventarioCache = data.data;
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error al cargar inventario:", error);
    showAlert("Error al cargar inventario desde el servidor", "error");
    return [];
  }
}

async function fetchHistorial() {
  try {
    const response = await fetch(`${API_BASE}/historial`);
    const data = await response.json();
    if (data.success) {
      historialCache = data.data;
      return data.data;
    }
    return [];
  } catch (error) {
    console.error("Error al cargar historial:", error);
    showAlert("Error al cargar historial desde el servidor", "error");
    return [];
  }
}

// =========================
// FUNCIONES DEL INVENTARIO
// =========================

function updateSubtipo() {
  const tipo = document.getElementById("tipo").value;
  const group = document.getElementById("subtipo-group");
  const select = document.getElementById("subtipo");

  if (tipo === "polo") {
    group.style.display = "block";
    select.innerHTML = `
      <option value="">Seleccionar subtipo...</option>
      <option value="fruta">Fruta</option>
      <option value="cremoso">Cremoso</option>
    `;
    select.required = true;
  } else {
    group.style.display = "none";
    select.innerHTML = '<option value="">Seleccionar subtipo...</option>';
    select.required = false;
    // Si no es polo, cargar sabores directamente
    if (tipo) {
      cargarSabores(tipo);
    }
  }
}

async function cargarSabores(tipo) {
  const selectSabor = document.getElementById("sabor-select");
  if (!selectSabor) return;

  selectSabor.innerHTML = '<option value="">Cargando...</option>';

  try {
    const response = await fetch(`${API_BASE}/sabores?tipo=${tipo}`);
    const data = await response.json();

    selectSabor.innerHTML = '<option value="">Seleccionar sabor...</option>';

    if (data.success && data.data.length > 0) {
      data.data.forEach(sabor => {
        const option = document.createElement("option");
        option.value = sabor;
        option.textContent = sabor;
        selectSabor.appendChild(option);
      });
    }

    // Opción para crear nuevo sabor
    const optionNuevo = document.createElement("option");
    optionNuevo.value = "__nuevo__";
    optionNuevo.textContent = "➕ Crear nuevo sabor...";
    selectSabor.appendChild(optionNuevo);

  } catch (error) {
    console.error("Error al cargar sabores:", error);
    selectSabor.innerHTML = '<option value="">Error al cargar sabores</option>';
    const optionNuevo = document.createElement("option");
    optionNuevo.value = "__nuevo__";
    optionNuevo.textContent = "➕ Crear nuevo sabor...";
    selectSabor.appendChild(optionNuevo);
  }
}

function handleSaborChange() {
  const selectSabor = document.getElementById("sabor-select");
  const grupoNuevo = document.getElementById("sabor-nuevo-group");
  const inputNuevo = document.getElementById("sabor-nuevo");

  if (selectSabor.value === "__nuevo__") {
    grupoNuevo.style.display = "block";
    inputNuevo.required = true;
  } else {
    grupoNuevo.style.display = "none";
    inputNuevo.required = false;
    inputNuevo.value = "";
  }
}

// =========================
// FORMULARIOS
// =========================

// Formulario crear helado
document.addEventListener("DOMContentLoaded", function () {
  // Listener para cambio de subtipo (polo)
  const subtipoSelect = document.getElementById("subtipo");
  if (subtipoSelect) {
    subtipoSelect.addEventListener("change", function () {
      const tipo = document.getElementById("tipo").value;
      const subtipo = this.value;

      if (tipo === "polo" && subtipo) {
        const tipoFinal = `polo-${subtipo}`;
        cargarSabores(tipoFinal);
      }
    });
  }

  const formCrear = document.getElementById("form-crear");
  if (formCrear) {
    formCrear.addEventListener("submit", async function (e) {
      e.preventDefault();

      const tipo = document.getElementById("tipo").value;
      const subtipo = document.getElementById("subtipo").value;
      const saborSelect = document.getElementById("sabor-select").value;
      const saborNuevo = document.getElementById("sabor-nuevo").value.trim();
      const cantidad = parseInt(document.getElementById("cantidad").value);

      // Determinar el sabor final
      let sabor;
      if (saborSelect === "__nuevo__") {
        sabor = saborNuevo;
      } else {
        sabor = saborSelect;
      }

      if (!sabor || cantidad <= 0) {
        showAlert("Por favor completa todos los campos correctamente", "error");
        return;
      }

      let tipoFinal = tipo;
      if (tipo === "polo" && subtipo) {
        tipoFinal = `polo-${subtipo}`;
      }

      try {
        const response = await fetch(`${API_BASE}/crear-helado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tipo: tipoFinal, sabor, cantidad }),
        });

        const data = await response.json();

        if (data.success) {
          showAlert(data.message || "Helado creado exitosamente", "success");
          this.reset();
          // Limpiar campos ocultos
          document.getElementById("subtipo-group").style.display = "none";
          document.getElementById("sabor-nuevo-group").style.display = "none";
        } else {
          showAlert(data.error || "Error al crear helado", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showAlert("Error de conexión al crear helado", "error");
      }
    });
  }
});

// Formulario bajar helado
document.addEventListener("DOMContentLoaded", function () {
  const tipoBajar = document.getElementById("tipo-bajar");
  if (tipoBajar) {
    tipoBajar.addEventListener("change", function () {
      updateProductosBajar();
    });
  }

  const subtipoBajar = document.getElementById("subtipo-bajar");
  if (subtipoBajar) {
    subtipoBajar.addEventListener("change", function () {
      const tipo = document.getElementById("tipo-bajar")?.value;
      const subtipo = this.value;

      if (tipo === "polo" && subtipo) {
        cargarProductosFiltrados(`polo-${subtipo}`);
      }
    });
  }

  const formBajar = document.getElementById("form-bajar");
  if (formBajar) {
    formBajar.addEventListener("submit", async function (e) {
      e.preventDefault();

      const tipo = document.getElementById("tipo-bajar")?.value;
      if (!tipo) {
        showAlert("Por favor selecciona un tipo de helado", "error");
        return;
      }

      if (tipo === "polo") {
        const subtipo = document.getElementById("subtipo-bajar")?.value;
        if (!subtipo) {
          showAlert("Por favor selecciona un subtipo de polo", "error");
          return;
        }
      }

      const id = parseInt(document.getElementById("producto-bajar").value);
      if (!id || isNaN(id)) {
        showAlert("Por favor selecciona un producto válido", "error");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/bajar-helado`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });

        const data = await response.json();

        if (data.success) {
          const producto = data.data;

          if (producto.cantidad === 0) {
            showAlert(
              `⚠️ ¡ATENCIÓN! ${producto.sabor} se ha quedado SIN STOCK`,
              "error"
            );
          } else if (producto.cantidad <= 2) {
            showAlert(
              `⚠️ ${producto.sabor} tiene STOCK BAJO (${producto.cantidad} unidades)`,
              "warning"
            );
          } else {
            showAlert(
              `✅ Stock de ${producto.sabor} reducido correctamente (${producto.cantidad} restantes)`,
              "success"
            );
          }

          await updateProductosBajar();
          document.getElementById("producto-bajar").value = "";
        } else {
          showAlert(data.error || "Error al bajar helado", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showAlert("Error de conexión al bajar helado", "error");
      }
    });
  }
});

// Formulario ajustar stock
document.addEventListener("DOMContentLoaded", function () {
  const formAjustar = document.getElementById("form-ajustar");
  if (formAjustar) {
    formAjustar.addEventListener("submit", async function (e) {
      e.preventDefault();

      const id = parseInt(document.getElementById("producto-ajustar").value);
      const nuevaCantidad = parseInt(
        document.getElementById("nueva-cantidad").value
      );
      const motivo = document.getElementById("motivo").value.trim();

      if (!motivo) {
        showAlert("Debes especificar un motivo para el ajuste", "error");
        return;
      }

      if (nuevaCantidad < 0) {
        showAlert("La cantidad no puede ser negativa", "error");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/ajustar-stock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, nuevaCantidad, motivo }),
        });

        const data = await response.json();

        if (data.success) {
          showAlert(
            data.message || "Inventario ajustado correctamente",
            "success"
          );
          this.reset();
          await cargarProductos("producto-ajustar");
        } else {
          showAlert(data.error || "Error al ajustar stock", "error");
        }
      } catch (error) {
        console.error("Error:", error);
        showAlert("Error de conexión al ajustar stock", "error");
      }
    });
  }
});

// =========================
// FUNCIONES DE DATOS
// =========================

async function cargarProductos(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

  select.innerHTML = '<option value="">Cargando...</option>';

  const inventario = await fetchInventario();
  select.innerHTML = '<option value="">Seleccionar producto...</option>';

  let productos = [];
  if (selectId === "producto-bajar") {
    productos = inventario.filter((p) => p.cantidad > 0);
  } else {
    productos = inventario;
  }

  productos
    .sort((a, b) => {
      if (a.tipo !== b.tipo) {
        const orden = ["barqueta", "polo-fruta", "polo-cremoso"];
        return orden.indexOf(a.tipo) - orden.indexOf(b.tipo);
      }
      return a.sabor.localeCompare(b.sabor);
    })
    .forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${getTipoNombre(p.tipo)} - ${p.sabor} (Stock: ${
        p.cantidad
      })`;
      select.appendChild(option);
    });

  if (productos.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent =
      selectId === "producto-bajar"
        ? "No hay productos con stock"
        : "No hay productos disponibles";
    select.appendChild(option);
  }
}

async function mostrarInventario() {
  const inventario = await fetchInventario();
  updateStats(inventario);

  if (inventario.length === 0) {
    document.getElementById("tabla-inventario").innerHTML =
      '<div class="empty-state">📦 No hay productos en el inventario</div>';
    return;
  }

  const ordenado = [...inventario].sort((a, b) => {
    if (a.tipo !== b.tipo) {
      const orden = ["barqueta", "polo-fruta", "polo-cremoso"];
      return orden.indexOf(a.tipo) - orden.indexOf(b.tipo);
    }
    const alertaA = a.cantidad <= 2 ? 0 : 1;
    const alertaB = b.cantidad <= 2 ? 0 : 1;

    if (alertaA !== alertaB) return alertaA - alertaB;
    return 0;
  });

  document.getElementById("tabla-inventario").innerHTML = createTable(
    ordenado,
    ["Tipo", "Sabor", "Stock", "Estado"],
    (p) => [
      getTipoNombre(p.tipo),
      p.sabor,
      p.cantidad,
      p.cantidad === 0
        ? '<span class="stock-off">⚠️ SIN STOCK</span>'
        : p.cantidad <= 2
        ? '<span class="stock-low">⚠️ STOCK BAJO</span>'
        : '<span class="stock-ok">✅ OK</span>',
    ]
  );
}

async function cargarProductosFiltrados(tipoFiltro) {
  const select = document.getElementById("producto-bajar");
  if (!select) return;

  select.innerHTML = '<option value="">Cargando...</option>';

  const inventario = await fetchInventario();
  select.innerHTML = '<option value="">Seleccionar producto...</option>';

  const productos = inventario.filter(
    (p) => p.tipo === tipoFiltro && p.cantidad > 0
  );

  if (productos.length === 0) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No hay productos disponibles con stock";
    select.appendChild(option);
    return;
  }

  productos
    .sort((a, b) => a.sabor.localeCompare(b.sabor))
    .forEach((p) => {
      const option = document.createElement("option");
      option.value = p.id;
      option.textContent = `${getTipoNombre(p.tipo)} - ${p.sabor} (Stock: ${
        p.cantidad
      })`;
      select.appendChild(option);
    });
}

async function updateProductosBajar() {
  const tipo = document.getElementById("tipo-bajar").value;
  const group = document.getElementById("subtipo-bajar-group");
  const selectSubtipo = document.getElementById("subtipo-bajar");
  const selectProducto = document.getElementById("producto-bajar");

  selectProducto.innerHTML =
    '<option value="">Seleccionar producto...</option>';

  if (tipo === "polo") {
    group.style.display = "block";
    selectSubtipo.innerHTML = `
      <option value="">Seleccionar subtipo...</option>
      <option value="fruta">Fruta</option>
      <option value="cremoso">Cremoso</option>
    `;
    selectSubtipo.required = true;

    const subtipo = selectSubtipo.value;
    if (subtipo) {
      await cargarProductosFiltrados(`polo-${subtipo}`);
    } else {
      selectProducto.innerHTML =
        '<option value="">Primero selecciona un subtipo...</option>';
    }
  } else if (tipo === "barqueta") {
    group.style.display = "none";
    selectSubtipo.innerHTML =
      '<option value="">Seleccionar subtipo...</option>';
    selectSubtipo.required = false;
    await cargarProductosFiltrados("barqueta");
  } else {
    group.style.display = "none";
    selectSubtipo.innerHTML =
      '<option value="">Seleccionar subtipo...</option>';
    selectSubtipo.required = false;
    selectProducto.innerHTML =
      '<option value="">Primero selecciona un tipo...</option>';
  }
}

async function filtrarTipo() {
  const filtro = document.getElementById("filtro-tipo").value;
  const inventario = await fetchInventario();
  const filtrados = filtro
    ? inventario.filter((p) => p.tipo === filtro)
    : inventario;

  if (filtrados.length === 0) {
    document.getElementById("tabla-filtrada").innerHTML =
      '<div class="empty-state">🔍 No hay productos de este tipo</div>';
    return;
  }

  const ordenados = filtrados.sort((a, b) => {
    if (a.tipo !== b.tipo) {
      const orden = ["barqueta", "polo-fruta", "polo-cremoso"];
      return orden.indexOf(a.tipo) - orden.indexOf(b.tipo);
    }
    const stockMin = a.stock_min || 2;
    const alertaA = a.cantidad <= stockMin ? 0 : 1;
    const alertaB = b.cantidad <= stockMin ? 0 : 1;

    if (alertaA !== alertaB) return alertaA - alertaB;
    return 0;
  });

  document.getElementById("tabla-filtrada").innerHTML = createTable(
    ordenados,
    ["Tipo", "Sabor", "Stock", "Estado"],
    (p) => {
      const stockMin = p.stock_min || 2;
      return [
        getTipoNombre(p.tipo),
        p.sabor,
        p.cantidad,
        p.cantidad === 0
          ? '<span class="stock-off">⚠️ SIN STOCK</span>'
          : p.cantidad <= stockMin
          ? '<span class="stock-low">⚠️ STOCK BAJO</span>'
          : '<span class="stock-ok">✅ OK</span>',
      ];
    }
  );
}

async function mostrarAlertas() {
  const inventario = await fetchInventario();
  const alertas = inventario.filter((p) => p.cantidad <= 2);

  if (alertas.length === 0) {
    document.getElementById("contenido-alertas").innerHTML =
      '<div class="empty-state">🎉 ¡Excelente! No hay alertas de stock</div>';
    return;
  }

  const criticas = alertas.filter((p) => p.cantidad === 0);
  const stockBajo = alertas.filter((p) => p.cantidad > 0);

  alertas.sort((a, b) => a.cantidad - b.cantidad);

  const resumenHtml = `
    <div class="stats-grid">
      <div class="stat-card" style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%);">
        <div class="stat-number">${criticas.length}</div>
        <div class="stat-label">Críticas (Sin Stock)</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #fd7e14 0%, #e55a00 100%);">
        <div class="stat-number">${stockBajo.length}</div>
        <div class="stat-label">Stock Bajo</div>
      </div>
      <div class="stat-card" style="background: linear-gradient(135deg, #6f42c1 0%, #5a2d91 100%);">
        <div class="stat-number">${alertas.length}</div>
        <div class="stat-label">Total Alertas</div>
      </div>
    </div>
  `;

  const tablaHtml = createTable(
    alertas,
    ["Prioridad", "Tipo", "Sabor", "Stock"],
    (p) => [
      p.cantidad === 0 ? "🔴 MÁXIMA" : "🟡 ALTA",
      getTipoNombre(p.tipo),
      p.sabor,
      p.cantidad,
    ]
  );

  document.getElementById("contenido-alertas").innerHTML = `
    <div class="alert error">⚠️ ${alertas.length} producto(s) requieren atención inmediata</div>
    ${resumenHtml}
    ${tablaHtml}
  `;
}

async function mostrarHistorial() {
  const historial = await fetchHistorial();

  if (historial.length === 0) {
    document.getElementById("tabla-historial").innerHTML =
      '<div class="empty-state">📝 Sin movimientos registrados</div>';
    return;
  }

  document.getElementById("tabla-historial").innerHTML = createTable(
    historial,
    ["Fecha", "Movimiento", "Producto", "Cantidad", "Motivo"],
    (h) => [
      formatearFecha(h.fecha),
      getTipoMovimiento(h.tipo),
      h.producto,
      h.cantidad,
      h.motivo,
    ]
  );
}

async function mostrarRanking() {
  const inventario = await fetchInventario();
  const conConsumo = inventario.filter((p) => p.consumido > 0);

  if (conConsumo.length === 0) {
    document.getElementById("tabla-ranking").innerHTML =
      '<div class="empty-state">📊 Sin datos de consumo disponibles</div>';
    return;
  }

  conConsumo.sort((a, b) => b.consumido - a.consumido);

  const tablaHtml = createTable(
    conConsumo,
    ["Ranking", "Tipo", "Sabor", "Vendidos", "Stock Actual"],
    (p, index) => [
      `<strong>${index + 1}º</strong>`,
      getTipoNombre(p.tipo),
      p.sabor,
      `<span style="font-weight:bold; color: #a3405b;">${p.consumido}</span>`,
      p.cantidad,
    ]
  );

  document.getElementById("tabla-ranking").innerHTML = tablaHtml;
}

// =========================
// FUNCIONES AUXILIARES
// =========================

function updateStats(inventario) {
  document.getElementById("stat-productos").textContent = inventario.length;
  document.getElementById("stat-unidades").textContent = inventario.reduce(
    (sum, p) => sum + p.cantidad,
    0
  );
  document.getElementById("stat-alertas").textContent = inventario.filter(
    (p) => p.cantidad <= 2
  ).length;
}

function createTable(data, headers, rowFn) {
  if (!data || data.length === 0) {
    return '<div class="empty-state">No hay datos para mostrar</div>';
  }

  let html = `<table class="inventory-table"><thead><tr>`;
  headers.forEach((h) => (html += `<th>${h}</th>`));
  html += `</tr></thead><tbody>`;

  data.forEach((item, i) => {
    html += `<tr>`;
    rowFn(item, i).forEach((cell) => (html += `<td>${cell}</td>`));
    html += `</tr>`;
  });

  html += `</tbody></table>`;
  return html;
}

function getTipoNombre(tipo) {
  const tipos = {
    barqueta: "🍨",
    "polo-fruta": "🍓",
    "polo-cremoso": "🥛",
  };
  return tipos[tipo] || tipo;
}

function getTipoMovimiento(tipo) {
  const tipos = {
    entrada: "⬆️ ENTRADA",
    salida: "⬇️ SALIDA",
    "ajuste+": "➕ AJUSTE+",
    "ajuste-": "➖ AJUSTE-",
  };
  return tipos[tipo] || tipo;
}

function formatearFecha(fecha) {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function showAlert(mensaje, tipo) {
  const alertasExistentes = document.querySelectorAll(".alert");
  alertasExistentes.forEach((a) => a.remove());

  const alerta = document.createElement("div");
  alerta.className = `alert ${tipo}`;
  alerta.textContent = mensaje;

  const container =
    document.querySelector(".current-view.active") ||
    document.querySelector(".main-content");

  if (container) {
    container.insertBefore(alerta, container.firstChild);

    setTimeout(() => {
      if (alerta.parentNode) {
        alerta.remove();
      }
    }, 3000);
  }
}
