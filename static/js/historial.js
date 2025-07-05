const Historial = {
  // Obtener historial del localStorage
  obtenerHistorial: () => {
    try {
      const historial = localStorage.getItem("historialSolver")
      return historial ? JSON.parse(historial) : []
    } catch (error) {
      console.error("Error al obtener historial:", error)
      return []
    }
  },

  // Guardar historial en localStorage
  guardarHistorial: (historial) => {
    try {
      localStorage.setItem("historialSolver", JSON.stringify(historial))
      console.log("Historial guardado correctamente")
    } catch (error) {
      console.error("Error al guardar historial:", error)
    }
  },

  // Agregar nueva entrada al historial
  agregarEntrada: function (tipo, datos, resultado) {
    try {
      const historial = this.obtenerHistorial()
      const entrada = {
        id: Date.now(),
        fecha: new Date().toLocaleString("es-ES"),
        tipo: tipo, // 'hungaro', 'programacion-lineal', 'p-mediana', 'centroide'
        datos: datos,
        resultado: resultado,
      }

      historial.unshift(entrada) // Agregar al inicio

      // Mantener solo los últimos 50 registros
      if (historial.length > 50) {
        historial.splice(50)
      }

      this.guardarHistorial(historial)
      this.actualizarInterfazHistorial()
      console.log("Entrada agregada al historial:", entrada)
    } catch (error) {
      console.error("Error al agregar entrada:", error)
    }
  },

  // Guardar datos del método húngaro
  guardarHungaro: function (matriz, encabezadosFilas, encabezadosColumnas, objetivo, resultado) {
    console.log("Guardando método húngaro...")
    const datos = {
      matriz: matriz,
      encabezadosFilas: encabezadosFilas,
      encabezadosColumnas: encabezadosColumnas,
      objetivo: objetivo,
    }
    this.agregarEntrada("hungaro", datos, resultado)
  },

  // Guardar datos de programación lineal
  guardarProgramacionLineal: function (variables, funcionObjetivo, restricciones, objetivo, resultado) {
    console.log("Guardando programación lineal...")
    const datos = {
      variables: variables,
      funcionObjetivo: funcionObjetivo,
      restricciones: restricciones,
      objetivo: objetivo,
    }
    this.agregarEntrada("programacion-lineal", datos, resultado)
  },

  // Guardar datos de P-Mediana
  guardarPMediana: function (matriz, encabezadosFilas, encabezadosColumnas, p, resultado) {
    console.log("Guardando P-Mediana...")
    const datos = {
      matriz: matriz,
      encabezadosFilas: encabezadosFilas,
      encabezadosColumnas: encabezadosColumnas,
      p: p,
    }
    this.agregarEntrada("p-mediana", datos, resultado)
  },

  // Guardar datos del Centroide
  guardarCentroide: function (puntos, resultado) {
    console.log("Guardando Centroide...")
    const datos = {
      puntos: puntos,
    }
    this.agregarEntrada("centroide", datos, resultado)
  },

  // Cargar datos del método húngaro desde el historial
  cargarHungaro: function (entrada) {
    try {
      console.log("Cargando datos húngaro:", entrada)
      const datos = entrada.datos

      // Verificar que estamos en la página correcta
      if (!document.getElementById("matrizCostos")) {
        alert("❌ Esta función solo está disponible en la página del Método Húngaro.")
        return
      }

      // Verificar que HungarianMethods existe
      if (typeof window.HungarianMethods === "undefined") {
        alert("❌ Error: HungarianMethods no está disponible.")
        return
      }

      const HungarianMethods = window.HungarianMethods

      // Actualizar dimensiones
      HungarianMethods.cantidadFilas = datos.matriz.length
      HungarianMethods.cantidadColumnas = datos.matriz[0].length

      // Recrear tabla
      const tabla = document.getElementById("matrizCostos")
      tabla.innerHTML = ""

      // Crear encabezado
      const thead = tabla.createTHead()
      const filaEncabezado = thead.insertRow()
      filaEncabezado.id = "filaEncabezado"
      const thVacio = document.createElement("th")
      filaEncabezado.appendChild(thVacio)

      for (let j = 0; j < HungarianMethods.cantidadColumnas; j++) {
        const th = document.createElement("th")
        th.innerHTML = `${datos.encabezadosColumnas[j]} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarColumna(${j})"><i class="bi bi-pencil-square"></i></button>`
        filaEncabezado.appendChild(th)
      }

      // Crear cuerpo
      const tbody = tabla.createTBody()
      for (let i = 0; i < HungarianMethods.cantidadFilas; i++) {
        const row = tbody.insertRow()
        const th = document.createElement("th")
        th.innerHTML = `${datos.encabezadosFilas[i]} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarFila(${i})"><i class="bi bi-pencil-square"></i></button>`
        row.appendChild(th)

        for (let j = 0; j < HungarianMethods.cantidadColumnas; j++) {
          const cell = row.insertCell()
          cell.innerHTML = `<input type="number" class="form-control form-control-sm matrix-input" step="any" value="${datos.matriz[i][j]}">`
        }
      }

      // Establecer objetivo
      const objetivoSelect = document.getElementById("objetivoHungaro")
      if (objetivoSelect) {
        objetivoSelect.value = datos.objetivo
      }

      // Cerrar historial después de cargar
      this.cerrarHistorial()
      alert("✅ Datos del método húngaro cargados desde el historial.")
    } catch (error) {
      console.error("Error al cargar datos húngaro:", error)
      alert("❌ Error al cargar los datos del historial: " + error.message)
    }
  },

  // Cargar datos de programación lineal desde el historial
  cargarProgramacionLineal: function (entrada) {
    try {
      console.log("Cargando datos programación lineal:", entrada)
      const datos = entrada.datos

      // Verificar que estamos en la página correcta
      if (!document.getElementById("variables-container")) {
        alert("❌ Esta función solo está disponible en la página de Programación Lineal.")
        return
      }

      // Verificar que LinearProgramming existe
      if (typeof window.LinearProgramming === "undefined") {
        alert("❌ Error: LinearProgramming no está disponible.")
        return
      }

      const LinearProgramming = window.LinearProgramming

      // Actualizar variables
      LinearProgramming.variables = [...datos.variables]
      LinearProgramming.actualizarInterfaz()

      // Cargar función objetivo
      setTimeout(() => {
        const variableCoefs = document.querySelectorAll(".variable-coef")
        variableCoefs.forEach((input) => {
          const variable = input.dataset.variable
          input.value = datos.funcionObjetivo[variable] || 0
        })

        // Limpiar restricciones existentes
        const restriccionesContainer = document.getElementById("restricciones-container")
        restriccionesContainer.innerHTML = ""

        // Cargar restricciones
        datos.restricciones.forEach((restriccion) => {
          const nuevaRestriccion = LinearProgramming.crearFilaRestriccion()

          // Llenar coeficientes
          const coefs = nuevaRestriccion.querySelectorAll(".restriccion-coef")
          coefs.forEach((input) => {
            const variable = input.dataset.variable
            input.value = restriccion.coeficientes[variable] || 0
          })

          // Establecer operador y valor
          nuevaRestriccion.querySelector(".restriccion-operador").value = restriccion.operador
          nuevaRestriccion.querySelector(".restriccion-valor").value = restriccion.valor

          restriccionesContainer.appendChild(nuevaRestriccion)
        })

        // Establecer objetivo
        const objetivoSelect = document.getElementById("objetivo")
        if (objetivoSelect) {
          objetivoSelect.value = datos.objetivo
        }
      }, 100)

      // Cerrar historial después de cargar
      this.cerrarHistorial()
      alert("✅ Datos de programación lineal cargados desde el historial.")
    } catch (error) {
      console.error("Error al cargar datos programación lineal:", error)
      alert("❌ Error al cargar los datos del historial: " + error.message)
    }
  },

  // Cargar datos de P-Mediana desde el historial
  cargarPMediana: function (entrada) {
    try {
      console.log("Cargando datos P-Mediana:", entrada)
      const datos = entrada.datos

      // Verificar que estamos en la página correcta
      if (!document.getElementById("matrizDistancias")) {
        alert("❌ Esta función solo está disponible en la página de P-Mediana.")
        return
      }

      // Verificar que PMedianaMethods existe
      if (typeof window.PMedianaMethods === "undefined") {
        alert("❌ Error: PMedianaMethods no está disponible.")
        return
      }

      const PMedianaMethods = window.PMedianaMethods

      // Actualizar dimensiones
      PMedianaMethods.cantidadFilas = datos.matriz.length
      PMedianaMethods.cantidadColumnas = datos.matriz[0].length

      // Recrear tabla
      const tabla = document.getElementById("matrizDistancias")
      tabla.innerHTML = ""

      // Crear encabezado
      const thead = tabla.createTHead()
      const filaEncabezado = thead.insertRow()
      filaEncabezado.id = "filaEncabezadoDistancias"
      const thVacio = document.createElement("th")
      filaEncabezado.appendChild(thVacio)

      for (let j = 0; j < PMedianaMethods.cantidadColumnas; j++) {
        const th = document.createElement("th")
        th.innerHTML = `${datos.encabezadosColumnas[j]} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarColumna(${j})"><i class="bi bi-pencil-square"></i></button>`
        filaEncabezado.appendChild(th)
      }

      // Crear cuerpo
      const tbody = tabla.createTBody()
      for (let i = 0; i < PMedianaMethods.cantidadFilas; i++) {
        const row = tbody.insertRow()
        const th = document.createElement("th")
        th.innerHTML = `${datos.encabezadosFilas[i]} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarFila(${i})"><i class="bi bi-pencil-square"></i></button>`
        row.appendChild(th)

        for (let j = 0; j < PMedianaMethods.cantidadColumnas; j++) {
          const cell = row.insertCell()
          cell.innerHTML = `<input type="number" class="form-control form-control-sm matrix-input" step="any" value="${datos.matriz[i][j]}" min="0">`
        }
      }

      // Establecer número de medianas
      const numeroMedianas = document.getElementById("numeroMedianas")
      if (numeroMedianas) {
        numeroMedianas.value = datos.p
      }

      // Cerrar historial después de cargar
      this.cerrarHistorial()
      alert("✅ Datos de P-Mediana cargados desde el historial.")
    } catch (error) {
      console.error("Error al cargar datos P-Mediana:", error)
      alert("❌ Error al cargar los datos del historial: " + error.message)
    }
  },

  // Cargar datos del Centroide desde el historial
  cargarCentroide: function (entrada) {
    try {
      console.log("Cargando datos Centroide:", entrada)
      const datos = entrada.datos

      // Verificar que estamos en la página correcta
      if (!document.getElementById("cartesianCanvas")) {
        alert("❌ Esta función solo está disponible en la página del Método del Centroide.")
        return
      }

      // Verificar que CentroideMethods existe
      if (typeof window.CentroideMethods === "undefined") {
        alert("❌ Error: CentroideMethods no está disponible.")
        return
      }

      const CentroideMethods = window.CentroideMethods

      // Limpiar datos actuales
      CentroideMethods.resetAll()

      // Cargar puntos
      datos.puntos.forEach((punto) => {
        CentroideMethods.addPoint(punto.name, punto.x, punto.y, punto.cost)
      })

      // Cerrar historial después de cargar
      this.cerrarHistorial()
      alert("✅ Datos del Método del Centroide cargados desde el historial.")
    } catch (error) {
      console.error("Error al cargar datos Centroide:", error)
      alert("❌ Error al cargar los datos del historial: " + error.message)
    }
  },

  // Eliminar entrada del historial
  eliminarEntrada: function (id) {
    if (confirm("¿Estás seguro de que quieres eliminar esta entrada del historial?")) {
      const historial = this.obtenerHistorial()
      const nuevoHistorial = historial.filter((entrada) => entrada.id !== id)
      this.guardarHistorial(nuevoHistorial)
      this.actualizarInterfazHistorial()
    }
  },

  // Limpiar todo el historial
  limpiarHistorial: function () {
    if (confirm("¿Estás seguro de que quieres limpiar todo el historial? Esta acción no se puede deshacer.")) {
      localStorage.removeItem("historialSolver")
      this.actualizarInterfazHistorial()
      alert("✅ Historial limpiado correctamente.")
    }
  },

  // Mostrar/ocultar panel de historial
  toggleHistorial: function () {
    const sidebar = document.getElementById("historial-sidebar")
    const overlay = document.getElementById("historial-overlay")

    if (sidebar && overlay) {
      if (sidebar.classList.contains("show")) {
        sidebar.classList.remove("show")
        overlay.classList.remove("show")
      } else {
        sidebar.classList.add("show")
        overlay.classList.add("show")
        this.actualizarInterfazHistorial()
      }
    }
  },

  // Cerrar historial
  cerrarHistorial: () => {
    const sidebar = document.getElementById("historial-sidebar")
    const overlay = document.getElementById("historial-overlay")
    if (sidebar && overlay) {
      sidebar.classList.remove("show")
      overlay.classList.remove("show")
    }
  },

  // Actualizar la interfaz del historial
  actualizarInterfazHistorial: function () {
    const container = document.getElementById("historial-container")
    if (!container) return

    const historial = this.obtenerHistorial()

    if (historial.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="bi bi-clock-history fs-3"></i>
          <p class="mt-2 small">No hay entradas en el historial</p>
        </div>
      `
      return
    }

    let html = ""
    historial.forEach((entrada) => {
      const tipoIcon = this.getTipoIcon(entrada.tipo)
      const tipoNombre = this.getTipoNombre(entrada.tipo)
      const tipoColor = this.getTipoColor(entrada.tipo)

      // Escapar JSON para HTML
      const entradaJson = JSON.stringify(entrada).replace(/"/g, "&quot;")

      html += `
        <div class="historial-item mb-2">
          <div class="card card-sm">
            <div class="card-body p-2">
              <div class="d-flex align-items-center mb-1">
                <i class="bi ${tipoIcon} text-${tipoColor} me-2"></i>
                <strong class="small">${tipoNombre}</strong>
              </div>
              <div class="small text-muted mb-2">${entrada.fecha}</div>
              <div class="small mb-2">
                ${this.formatearDatosCompacto(entrada)}
              </div>
              <div class="d-flex gap-1">
                <button class="btn btn-success btn-sm flex-fill" onclick="Historial.${this.getCargarFunction(entrada.tipo)}(${entradaJson})" title="Cargar datos">
                  <i class="bi bi-download"></i>
                </button>
                <button class="btn btn-outline-danger btn-sm" onclick="Historial.eliminarEntrada(${entrada.id})" title="Eliminar">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      `
    })

    container.innerHTML = html
  },

  getTipoIcon: (tipo) => {
    const icons = {
      hungaro: "bi-grid-3x3-gap",
      "programacion-lineal": "bi-graph-up",
      "p-mediana": "bi-geo-alt",
      centroide: "bi-bullseye",
    }
    return icons[tipo] || "bi-question-circle"
  },

  getTipoNombre: (tipo) => {
    const nombres = {
      hungaro: "Húngaro",
      "programacion-lineal": "Prog. Lineal",
      "p-mediana": "P-Mediana",
      centroide: "Centroide",
    }
    return nombres[tipo] || "Desconocido"
  },

  getTipoColor: (tipo) => {
    const colores = {
      hungaro: "primary",
      "programacion-lineal": "success",
      "p-mediana": "warning",
      centroide: "info",
    }
    return colores[tipo] || "secondary"
  },

  getCargarFunction: (tipo) => {
    const funciones = {
      hungaro: "cargarHungaro",
      "programacion-lineal": "cargarProgramacionLineal",
      "p-mediana": "cargarPMediana",
      centroide: "cargarCentroide",
    }
    return funciones[tipo] || "cargarGenerico"
  },

  // Formatear datos de forma compacta para el sidebar
  formatearDatosCompacto: (entrada) => {
    if (entrada.tipo === "hungaro") {
      const datos = entrada.datos
      return `
        <div><strong>Objetivo:</strong> ${datos.objetivo}</div>
        <div><strong>Tamaño:</strong> ${datos.matriz.length}x${datos.matriz[0].length}</div>
      `
    } else if (entrada.tipo === "p-mediana") {
      const datos = entrada.datos
      return `
        <div><strong>P (Medianas):</strong> ${datos.p}</div>
        <div><strong>Tamaño:</strong> ${datos.matriz.length}x${datos.matriz[0].length}</div>
      `
    } else if (entrada.tipo === "centroide") {
      const datos = entrada.datos
      return `
        <div><strong>Puntos:</strong> ${datos.puntos.length}</div>
        <div><strong>Centroide:</strong> (${entrada.resultado.centroide ? entrada.resultado.centroide.x.toFixed(2) : "N/A"}, ${entrada.resultado.centroide ? entrada.resultado.centroide.y.toFixed(2) : "N/A"})</div>
      `
    } else {
      const datos = entrada.datos
      return `
        <div><strong>Objetivo:</strong> ${datos.objetivo}</div>
        <div><strong>Variables:</strong> ${datos.variables.join(", ")}</div>
      `
    }
  },

  // Exportar historial a JSON
  exportarHistorial: function () {
    const historial = this.obtenerHistorial()
    if (historial.length === 0) {
      alert("No hay datos en el historial para exportar.")
      return
    }

    const dataStr = JSON.stringify(historial, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })

    const link = document.createElement("a")
    link.href = URL.createObjectURL(dataBlob)
    link.download = `historial_solver_${new Date().toISOString().split("T")[0]}.json`
    link.click()
  },

  // Inicializar historial
  inicializar: () => {
    // Solo agregar elementos si no existen ya
    if (document.getElementById("historial-sidebar")) {
      return // Ya está inicializado
    }

    // Agregar estilos CSS
    const styles = `
      <style id="historial-styles">
        #historial-sidebar {
          position: fixed;
          top: 0;
          left: -350px;
          width: 350px;
          height: 100vh;
          background: white;
          box-shadow: 2px 0 10px rgba(0,0,0,0.1);
          z-index: 1050;
          transition: left 0.3s ease;
          overflow-y: auto;
        }
        
        #historial-sidebar.show {
          left: 0;
        }
        
        #historial-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          z-index: 1040;
          opacity: 0;
          visibility: hidden;
          transition: all 0.3s ease;
        }
        
        #historial-overlay.show {
          opacity: 1;
          visibility: visible;
        }
        
        .historial-item .card-sm {
          border-radius: 8px;
          border: 1px solid #e3e6f0;
        }
        
        .historial-item .card-sm:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        
        .historial-header {
          background: var(--primary-color, #4e73df);
          color: white;
          padding: 1rem;
          border-bottom: 1px solid #e3e6f0;
        }
        
        .historial-content {
          padding: 1rem;
        }
        
        @media (max-width: 768px) {
          #historial-sidebar {
            width: 300px;
            left: -300px;
          }
        }
      </style>
    `

    document.head.insertAdjacentHTML("beforeend", styles)

    // Agregar sidebar de historial
    const sidebarHTML = `
      <!-- Overlay para cerrar el sidebar -->
      <div id="historial-overlay" onclick="Historial.cerrarHistorial()"></div>
      
      <!-- Sidebar del Historial -->
      <div id="historial-sidebar">
        <div class="historial-header">
          <div class="d-flex justify-content-between align-items-center">
            <div>
              <h5 class="mb-0"><i class="bi bi-clock-history"></i> Historial</h5>
            </div>
            <button class="btn btn-sm btn-outline-light" onclick="Historial.cerrarHistorial()">
              <i class="bi bi-x-lg"></i>
            </button>
          </div>
          <div class="mt-2">
            <button class="btn btn-sm btn-outline-light me-1" onclick="Historial.exportarHistorial()" title="Exportar historial">
              <i class="bi bi-download"></i>
            </button>
            <button class="btn btn-sm btn-outline-light" onclick="Historial.limpiarHistorial()" title="Limpiar historial">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </div>
        <div class="historial-content">
          <div id="historial-container">
            <!-- El contenido se carga dinámicamente -->
          </div>
        </div>
      </div>
    `

    // Agregar el sidebar al body
    document.body.insertAdjacentHTML("beforeend", sidebarHTML)

    // Agregar botón de historial en la navegación si existe
    const nav = document.querySelector("nav")
    if (nav && !nav.querySelector(".btn-historial")) {
      const botonHistorial = `
        <button class="btn btn-outline-info ms-2 btn-historial" onclick="Historial.toggleHistorial()">
          <i class="bi bi-clock-history"></i> Ver Historial
        </button>
      `
      nav.insertAdjacentHTML("beforeend", botonHistorial)
    }
  },
}

// Hacer Historial disponible globalmente
window.Historial = Historial

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando historial...")
  Historial.inicializar()
})
