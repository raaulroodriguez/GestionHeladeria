// =========================
// BASE DE DATOS DEL INVENTARIO
// =========================

let inventario = [];
let historial = [];
let contadorId = 1;

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
  }
}

// Formulario crear helado
document.addEventListener("DOMContentLoaded", function () {
  const formCrear = document.getElementById("form-crear");
  if (formCrear) {
    formCrear.addEventListener("submit", function (e) {
      e.preventDefault();

      const tipo = document.getElementById("tipo").value;
      const subtipo = document.getElementById("subtipo").value;
      const sabor = document.getElementById("sabor").value.trim();
      const cantidad = parseInt(document.getElementById("cantidad").value);

      if (!sabor || cantidad <= 0) {
        showAlert("Por favor completa todos los campos correctamente", "error");
        return;
      }

      let tipoFinal = tipo;
      if (tipo === "polo" && subtipo) {
        tipoFinal = `polo-${subtipo}`;
      }

      const stockMin = 2;

      // Buscar si ya existe el producto
      const existente = inventario.find(
        (p) =>
          p.tipo === tipoFinal && p.sabor.toLowerCase() === sabor.toLowerCase()
      );

      if (existente) {
        existente.cantidad += cantidad;
        showAlert(
          `Stock actualizado: +${cantidad} unidades (Total: ${existente.cantidad})`,
          "success"
        );
      } else {
        inventario.push({
          id: contadorId++,
          tipo: tipoFinal,
          sabor: sabor,
          cantidad: cantidad,
          stockMin: stockMin,
          consumido: 0,
        });
        showAlert(`Helado creado exitosamente`, "success");
      }

      addHistorial(
        "entrada",
        `${getTipoNombre(tipoFinal)} - ${sabor}`,
        cantidad,
        "Elaborado"
      );

      this.reset();
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
    formBajar.addEventListener("submit", function (e) {
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

      const producto = inventario.find((p) => p.id === id);

      if (!producto) {
        showAlert("Producto no encontrado", "error");
        return;
      }

      if (producto.cantidad <= 0) {
        showAlert("Sin stock disponible", "error");
        return;
      }

      producto.cantidad--;
      producto.consumido = (producto.consumido || 0) + 1;

      addHistorial(
        "salida",
        `${getTipoNombre(producto.tipo)} - ${producto.sabor}`,
        1,
        "Bajado a tienda"
      );

      if (producto.cantidad === 0) {
        showAlert(
          `⚠️ ¡ATENCIÓN! ${producto.sabor} se ha quedado SIN STOCK`,
          "error"
        );
      } else if (producto.cantidad <= producto.stockMin) {
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

      updateProductosBajar();
      document.getElementById("producto-bajar").value = "";
    });
  }
});

// Formulario ajustar stock
document.addEventListener("DOMContentLoaded", function () {
  const formAjustar = document.getElementById("form-ajustar");
  if (formAjustar) {
    formAjustar.addEventListener("submit", function (e) {
      e.preventDefault();

      const id = parseInt(document.getElementById("producto-ajustar").value);
      const nuevaCant = parseInt(
        document.getElementById("nueva-cantidad").value
      );
      const motivo = document.getElementById("motivo").value.trim();
      const producto = inventario.find((p) => p.id === id);

      if (!producto) {
        showAlert("Producto no encontrado", "error");
        return;
      }

      if (nuevaCant < 0) {
        showAlert("La cantidad no puede ser negativa", "error");
        return;
      }

      if (!motivo) {
        showAlert("Debes especificar un motivo para el ajuste", "error");
        return;
      }

      const cantidadAnterior = producto.cantidad;
      const diferencia = nuevaCant - cantidadAnterior;
      producto.cantidad = nuevaCant;

      const tipoMovimiento = diferencia >= 0 ? "ajuste+" : "ajuste-";
      addHistorial(
        tipoMovimiento,
        `${getTipoNombre(producto.tipo)} - ${producto.sabor}`,
        Math.abs(diferencia),
        `Ajuste: ${motivo}\nInventario ajustado: ${cantidadAnterior} → ${nuevaCant}`
      );

      showAlert(
        `Inventario ajustado: ${cantidadAnterior} → ${nuevaCant}`,
        "success"
      );
      this.reset();
      cargarProductos("producto-ajustar");
    });
  }
});

// =========================
// FUNCIONES DE DATOS
// =========================

function cargarProductos(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return;

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

function mostrarInventario() {
  updateStats();

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

function cargarProductosFiltrados(tipoFiltro) {
  const select = document.getElementById("producto-bajar");
  if (!select) return;

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

function updateProductosBajar() {
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
      cargarProductosFiltrados(`polo-${subtipo}`);
    } else {
      selectProducto.innerHTML =
        '<option value="">Primero selecciona un subtipo...</option>';
    }
  } else if (tipo === "barqueta") {
    group.style.display = "none";
    selectSubtipo.innerHTML =
      '<option value="">Seleccionar subtipo...</option>';
    selectSubtipo.required = false;
    cargarProductosFiltrados("barqueta");
  } else {
    group.style.display = "none";
    selectSubtipo.innerHTML =
      '<option value="">Seleccionar subtipo...</option>';
    selectSubtipo.required = false;
    selectProducto.innerHTML =
      '<option value="">Primero selecciona un tipo...</option>';
  }
}

function filtrarTipo() {
  const filtro = document.getElementById("filtro-tipo").value;
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
    const alertaA = a.cantidad <= a.stockMin ? 0 : 1;
    const alertaB = b.cantidad <= b.stockMin ? 0 : 1;

    if (alertaA !== alertaB) return alertaA - alertaB;
    return 0;
  });

  document.getElementById("tabla-filtrada").innerHTML = createTable(
    ordenados,
    ["Tipo", "Sabor", "Stock", "Estado"],
    (p) => [
      getTipoNombre(p.tipo),
      p.sabor,
      p.cantidad,
      p.cantidad === 0
        ? '<span class="stock-off">⚠️ SIN STOCK</span>'
        : p.cantidad <= p.stockMin
        ? '<span class="stock-low">⚠️ STOCK BAJO</span>'
        : '<span class="stock-ok">✅ OK</span>',
    ]
  );
}

function mostrarAlertas() {
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

function mostrarHistorial() {
  if (historial.length === 0) {
    document.getElementById("tabla-historial").innerHTML =
      '<div class="empty-state">📝 Sin movimientos registrados</div>';
    return;
  }

  const ordenado = [...historial]
    .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    .slice(0, 50);

  document.getElementById("tabla-historial").innerHTML = createTable(
    ordenado,
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

function mostrarRanking() {
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

function updateStats() {
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

function addHistorial(tipo, producto, cantidad, motivo = "Operación estándar") {
  historial.push({
    id: Date.now() + Math.random(),
    fecha: new Date().toISOString(),
    tipo: tipo,
    producto: producto,
    cantidad: cantidad,
    motivo: motivo,
  });

  if (historial.length > 500) {
    historial = historial.slice(-500);
  }
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
