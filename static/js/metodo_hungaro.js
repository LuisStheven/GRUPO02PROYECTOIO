const HungarianMethods = {
  cantidadFilas: 3,
  cantidadColumnas: 3,
  ultimaMatriz: null,
  ultimoResultado: null,
  ultimoObjetivo: null,
  ultimosEncabezadosFilas: null,
  ultimosEncabezadosColumnas: null,
  ultimosResultadosSensibilidad: null,

  agregarFila: function () {
    const tabla = document.getElementById("matrizCostos").getElementsByTagName("tbody")[0]
    const nuevaFila = tabla.insertRow()
    const primeraCelda = nuevaFila.insertCell(0)
    primeraCelda.innerHTML = `Trabajador ${this.cantidadFilas + 1} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarFila(${this.cantidadFilas})"><i class="bi bi-pencil-square"></i></button>`

    for (let i = 0; i < this.cantidadColumnas; i++) {
      const celda = nuevaFila.insertCell(i + 1)
      celda.innerHTML = '<input type="number" step="any" class="form-control form-control-sm matrix-input" value="0">'
    }
    this.cantidadFilas++
  },

  agregarColumna: function () {
    const filaEncabezado = document.getElementById("filaEncabezado")
    const celdaEncabezado = filaEncabezado.insertCell(filaEncabezado.cells.length)
    celdaEncabezado.innerHTML = `Trabajo ${this.cantidadColumnas + 1} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarColumna(${this.cantidadColumnas})"><i class="bi bi-pencil-square"></i></button>`

    const filas = document.getElementById("matrizCostos").rows
    for (let i = 1; i < filas.length; i++) {
      const celda = filas[i].insertCell(filas[i].cells.length)
      celda.innerHTML = '<input type="number" step="any" class="form-control form-control-sm matrix-input" value="0">'
    }
    this.cantidadColumnas++
  },

  eliminarFila: function () {
    if (this.cantidadFilas <= 1) {
      alert("Debe haber al menos una fila")
      return
    }
    const tabla = document.getElementById("matrizCostos").getElementsByTagName("tbody")[0]
    tabla.deleteRow(tabla.rows.length - 1)
    this.cantidadFilas--
  },

  eliminarColumna: function () {
    if (this.cantidadColumnas <= 1) {
      alert("Debe haber al menos una columna")
      return
    }
    const filaEncabezado = document.getElementById("filaEncabezado")
    filaEncabezado.deleteCell(filaEncabezado.cells.length - 1)

    const filas = document.getElementById("matrizCostos").rows
    for (let i = 1; i < filas.length; i++) {
      filas[i].deleteCell(filas[i].cells.length - 1)
    }
    this.cantidadColumnas--
  },

  renombrarFila: (indiceFila) => {
    const nuevoNombre = prompt("Nuevo nombre para el trabajador:")
    if (nuevoNombre) {
      const filas = document.getElementById("matrizCostos").rows
      filas[indiceFila + 1].cells[0].innerHTML =
        `${nuevoNombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarFila(${indiceFila})"><i class="bi bi-pencil-square"></i></button>`
    }
  },

  renombrarColumna: (indiceColumna) => {
    const nuevoNombre = prompt("Nuevo nombre para el trabajo:")
    if (nuevoNombre) {
      const filaEncabezado = document.getElementById("filaEncabezado")
      filaEncabezado.cells[indiceColumna + 1].innerHTML =
        `${nuevoNombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarColumna(${indiceColumna})"><i class="bi bi-pencil-square"></i></button>`
    }
  },

  resolver: async () => {
    const tabla = document.getElementById("matrizCostos")
    const matriz = []
    let hayDatos = false

    // Validar que hay datos ingresados
    for (let i = 1; i < tabla.rows.length; i++) {
      const fila = []
      for (let j = 1; j < tabla.rows[i].cells.length; j++) {
        const input = tabla.rows[i].cells[j].querySelector("input")
        const valor = Number.parseFloat(input.value) || 0
        fila.push(valor)

        // Verificar si hay al menos un valor diferente de 0
        if (valor !== 0) {
          hayDatos = true
        }
      }
      matriz.push(fila)
    }

    // Validar que se han ingresado datos
    if (!hayDatos) {
      alert("❌ Por favor, ingresa al menos un valor diferente de cero en la matriz antes de resolver.")
      document.getElementById("resultado-hungaro").innerHTML = `
        <div class="alert alert-warning">
          <h4><i class="bi bi-exclamation-triangle"></i> Sin datos</h4>
          <p>Por favor, ingresa los valores en la matriz de costos antes de resolver el problema.</p>
        </div>
      `
      return
    }

    const objetivo = document.getElementById("objetivoHungaro").value

    // Obtener encabezados
    const etiquetasFilas = Array.from(tabla.rows)
      .slice(1)
      .map((fila) => fila.cells[0].innerText.trim().split("\n")[0])
    const etiquetasEncabezado = Array.from(tabla.rows[0].cells)
      .slice(1)
      .map((celda) => celda.innerText.trim().split("\n")[0])

    // Mostrar loading
    document.getElementById("resultado-hungaro").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Resolviendo problema...</span>
        </div>
      </div>
    `

    try {
      // Enviar datos al backend
      const response = await fetch("/api/hungarian", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matriz: matriz,
          objetivo: objetivo,
          encabezados_filas: etiquetasFilas,
          encabezados_columnas: etiquetasEncabezado,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el servidor")
      }

      // Mostrar resultado
      const lineasResultado = resultado.asignaciones.map(
        (asignacion) => `${asignacion.fila} ➝ ${asignacion.columna} (Costo: ${asignacion.costo})`,
      )

      document.getElementById("resultado-hungaro").innerHTML = `
        <div class="alert alert-success">
          <h4><i class="bi bi-check-circle"></i> Asignación Óptima:</h4>
          <pre>${lineasResultado.join("\n")}</pre>
          <strong>${objetivo === "maximizar" ? "Ganancia máxima" : "Costo mínimo"}: ${resultado.costo_total}</strong>
        </div>
      `

      // Agregar botón de interpretación IA
      const resultadoDiv = document.getElementById("resultado-hungaro")
      const botonIA = document.createElement("div")
      botonIA.className = "mt-2"
      botonIA.innerHTML = `
        <button class="btn btn-info btn-sm" onclick="HungarianMethods.interpretarResultadosIA()">
          <i class="bi bi-robot"></i> Interpretar con IA
        </button>
      `
      resultadoDiv.appendChild(botonIA)

      // Guardar datos para análisis de sensibilidad
      HungarianMethods.ultimaMatriz = matriz
      HungarianMethods.ultimoResultado = resultado
      HungarianMethods.ultimoObjetivo = objetivo
      HungarianMethods.ultimosEncabezadosFilas = etiquetasFilas
      HungarianMethods.ultimosEncabezadosColumnas = etiquetasEncabezado

      console.log("Datos guardados para análisis:", {
        ultimaMatriz: HungarianMethods.ultimaMatriz,
        ultimoResultado: HungarianMethods.ultimoResultado,
        ultimoObjetivo: HungarianMethods.ultimoObjetivo,
      })

      // Mostrar sección de análisis de sensibilidad
      document.getElementById("analisis-sensibilidad-hungaro").style.display = "block"

      // Llenar select de costos individuales
      const selectCosto = document.getElementById("costoIndividual")
      selectCosto.innerHTML = ""
      for (let i = 0; i < matriz.length; i++) {
        for (let j = 0; j < matriz[i].length; j++) {
          const option = document.createElement("option")
          option.value = `${i},${j}`
          option.textContent = `${etiquetasFilas[i]} → ${etiquetasEncabezado[j]} (${matriz[i][j]})`
          selectCosto.appendChild(option)
        }
      }

      // Guardar en el historial
      const Historial = window.Historial
      if (Historial) {
        Historial.guardarHungaro(matriz, etiquetasFilas, etiquetasEncabezado, objetivo, resultado)
      }
    } catch (error) {
      console.error("Error:", error)
      document.getElementById("resultado-hungaro").innerHTML = `
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
          <p>Error al resolver: ${error.message}</p>
        </div>
      `
    }
  },

  cargarDesdeExcel: function (event) {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result)
        const XLSX = window.XLSX
        const workbook = XLSX.read(data, { type: "array" })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const matrizCompleta = XLSX.utils.sheet_to_json(sheet, { header: 1 })

        // Validación y procesamiento similar al código original
        if (matrizCompleta.length < 1 || matrizCompleta[0].length < 1) {
          alert("❌ Error: El archivo debe contener al menos 1 fila y 1 columna.")
          event.target.value = ""
          return
        }

        // Detectar encabezados y procesar datos
        const primeraFila = matrizCompleta[0]
        const primeraColumna = matrizCompleta.map((fila) => fila[0])

        let tieneEncabezadosColumna = false
        let tieneEncabezadosFila = false

        // Verificar encabezados de columna
        for (let i = 0; i < primeraFila.length; i++) {
          const valor = primeraFila[i]
          if (valor != null && valor !== "" && (typeof valor === "string" || isNaN(Number(valor)))) {
            tieneEncabezadosColumna = true
            break
          }
        }

        // Verificar encabezados de fila
        for (let i = 0; i < primeraColumna.length; i++) {
          const valor = primeraColumna[i]
          if (valor != null && valor !== "" && (typeof valor === "string" || isNaN(Number(valor)))) {
            tieneEncabezadosFila = true
            break
          }
        }

        let nombresColumnas = []
        let nombresFilas = []
        let datos = []

        if (tieneEncabezadosColumna && tieneEncabezadosFila) {
          if (matrizCompleta.length < 2 || matrizCompleta[0].length < 2) {
            alert("❌ Error: Con encabezados, el archivo debe contener al menos 2 filas y 2 columnas.")
            event.target.value = ""
            return
          }
          nombresColumnas = matrizCompleta[0].slice(1)
          nombresFilas = matrizCompleta.slice(1).map((f) => f[0])
          datos = matrizCompleta.slice(1).map((fila) => fila.slice(1))
        } else if (tieneEncabezadosColumna && !tieneEncabezadosFila) {
          nombresColumnas = matrizCompleta[0]
          nombresFilas = matrizCompleta.slice(1).map((_, i) => `Trabajador ${i + 1}`)
          datos = matrizCompleta.slice(1)
        } else if (!tieneEncabezadosColumna && tieneEncabezadosFila) {
          nombresColumnas = matrizCompleta[0].slice(1).map((_, i) => `Trabajo ${i + 1}`)
          nombresFilas = matrizCompleta.map((f) => f[0])
          datos = matrizCompleta.map((fila) => fila.slice(1))
        } else {
          nombresColumnas = matrizCompleta[0].map((_, i) => `Trabajo ${i + 1}`)
          nombresFilas = matrizCompleta.map((_, i) => `Trabajador ${i + 1}`)
          datos = matrizCompleta
        }

        // Validar datos numéricos
        for (let i = 0; i < datos.length; i++) {
          for (let j = 0; j < datos[i].length; j++) {
            const valor = datos[i][j]
            if (valor == null || valor === "" || isNaN(Number(valor))) {
              alert(`❌ Error: La celda en fila ${i + 1}, columna ${j + 1} no contiene un número válido.`)
              event.target.value = ""
              return
            }
          }
        }

        // Actualizar interfaz
        this.cantidadFilas = datos.length
        this.cantidadColumnas = datos[0].length

        const tabla = document.getElementById("matrizCostos")
        tabla.innerHTML = ""

        // Crear encabezado
        const thead = tabla.createTHead()
        const filaEncabezado = thead.insertRow()
        filaEncabezado.id = "filaEncabezado"
        const thVacio = document.createElement("th")
        filaEncabezado.appendChild(thVacio)

        for (let j = 0; j < this.cantidadColumnas; j++) {
          const th = document.createElement("th")
          const nombre = nombresColumnas[j] ?? `Trabajo ${j + 1}`
          th.innerHTML = `${nombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarColumna(${j})"><i class="bi bi-pencil-square"></i></button>`
          filaEncabezado.appendChild(th)
        }

        // Crear cuerpo
        const tbody = tabla.createTBody()
        for (let i = 0; i < this.cantidadFilas; i++) {
          const row = tbody.insertRow()
          const th = document.createElement("th")
          const nombre = nombresFilas[i] ?? `Trabajador ${i + 1}`
          th.innerHTML = `${nombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarFila(${i})"><i class="bi bi-pencil-square"></i></button>`
          row.appendChild(th)

          for (let j = 0; j < this.cantidadColumnas; j++) {
            const cell = row.insertCell()
            const val = datos[i][j] != null ? Number(datos[i][j]) : 0
            cell.innerHTML = `<input type="number" class="form-control form-control-sm matrix-input" step="any" value="${val}">`
          }
        }

        alert("✅ Matriz cargada correctamente desde Excel.")
      } catch (error) {
        alert(`❌ Error al procesar el archivo Excel: ${error.message}`)
        event.target.value = ""
      }
    }

    reader.readAsArrayBuffer(file)
  },

  borrarDatos: () => {
    const tabla = document.getElementById("matrizCostos")
    const filas = tabla.querySelectorAll("tbody tr")

    // Limpiar inputs de cada celda
    filas.forEach((fila, i) => {
      const inputs = fila.querySelectorAll("input")
      inputs.forEach((input) => (input.value = ""))

      // Resetear encabezado de fila
      const th = fila.querySelector("th")
      if (th) {
        th.innerHTML = `Trabajador ${i + 1} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarFila(${i})"><i class="bi bi-pencil-square"></i></button>`
      }
    })

    // Limpiar encabezados de columnas
    const encabezados = document.querySelectorAll("#filaEncabezado th")
    encabezados.forEach((th, j) => {
      if (j === 0) return
      th.innerHTML = `Trabajo ${j} <button class="btn btn-sm btn-link p-0 ms-1" onclick="HungarianMethods.renombrarColumna(${j - 1})"><i class="bi bi-pencil-square"></i></button>`
    })

    // Limpiar resultado
    document.getElementById("resultado-hungaro").innerHTML = ""
  },

  analizarSensibilidad: async function () {
    console.log("Verificando datos para análisis:", {
      ultimaMatriz: this.ultimaMatriz,
      ultimoResultado: this.ultimoResultado,
      ultimoObjetivo: this.ultimoObjetivo,
    })

    if (!this.ultimaMatriz || !this.ultimoResultado) {
      alert("❌ Primero debes resolver el problema antes de realizar el análisis de sensibilidad.")
      return
    }

    const porcentaje = Number.parseFloat(document.getElementById("porcentajeVariacion").value) || 10
    const tipoAnalisis = document.getElementById("tipoAnalisis").value

    // Mostrar loading
    document.getElementById("resultados-sensibilidad-hungaro").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Analizando sensibilidad...</span>
        </div>
      </div>
    `

    try {
      // Usar el nuevo endpoint de análisis de sensibilidad
      const response = await fetch("/api/hungarian-sensitivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matriz: this.ultimaMatriz,
          objetivo: this.ultimoObjetivo,
          porcentaje: porcentaje,
          tipo: tipoAnalisis,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el análisis")
      }

      this.mostrarResultadosSensibilidad(resultado.resultados, tipoAnalisis)
    } catch (error) {
      console.error("Error en análisis de sensibilidad:", error)
      document.getElementById("resultados-sensibilidad-hungaro").innerHTML = `
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
          <p>Error en el análisis: ${error.message}</p>
        </div>
      `
    }
  },

  mostrarResultadosSensibilidad: (resultados, tipoAnalisis) => {
    const container = document.getElementById("resultados-sensibilidad-hungaro")

    if (resultados.length === 0) {
      container.innerHTML = `
            <div class="alert alert-warning">
                <i class="bi bi-exclamation-triangle"></i> No se pudieron generar resultados de sensibilidad.
            </div>
        `
      return
    }

    // Guardar resultados para interpretación IA
    HungarianMethods.ultimosResultadosSensibilidad = resultados

    let html = `<h6>Resultados del Análisis (Calculado con Python)</h6>`

    html += `
        <div class="alert alert-info">
            <strong>Elementos más sensibles:</strong>
        </div>
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Posición</th>
                        <th>Valor Original</th>
                        <th>Valor Nuevo</th>
                        <th>Impacto %</th>
                        <th>Sensibilidad</th>
                    </tr>
                </thead>
                <tbody>
    `

    resultados.forEach((resultado) => {
      const impactoClass =
        resultado.sensibilidad === "Alta"
          ? "text-danger"
          : resultado.sensibilidad === "Media"
            ? "text-warning"
            : "text-success"

      html += `
            <tr>
                <td>${resultado.posicion}</td>
                <td>${resultado.valor_original.toFixed(2)}</td>
                <td>${resultado.valor_nuevo.toFixed(2)}</td>
                <td class="${impactoClass}">
                    ${resultado.impacto_porcentual > 0 ? "+" : ""}${resultado.impacto_porcentual.toFixed(2)}%
                </td>
                <td class="${impactoClass}">
                    <strong>${resultado.sensibilidad}</strong>
                </td>
            </tr>
        `
    })

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <button class="btn btn-info btn-sm" onclick="HungarianMethods.interpretarSensibilidadIA()">
                <i class="bi bi-robot"></i> Interpretar con IA
            </button>
        </div>
    `

    container.innerHTML = html
  },

  // ==================== FUNCIONES DE IA ====================

  interpretarResultadosIA: async function () {
    if (!this.ultimoResultado || !this.ultimaMatriz) {
      alert("❌ Primero debes resolver el problema antes de interpretar los resultados.")
      return
    }

    const containerId = "interpretacion-ia-hungaro"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const resultadoDiv = document.getElementById("resultado-hungaro")
      container = document.createElement("div")
      container.id = containerId
      resultadoDiv.parentNode.insertBefore(container, resultadoDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Analizando resultados con IA...")

    // Preparar datos contextuales más ricos
    const datosEntrada = {
      matriz: this.ultimaMatriz,
      objetivo: this.ultimoObjetivo,
      encabezados_filas: this.ultimosEncabezadosFilas,
      encabezados_columnas: this.ultimosEncabezadosColumnas,
      dimensiones: {
        filas: this.ultimaMatriz.length,
        columnas: this.ultimaMatriz[0].length,
      },
      tipo_problema: this.ultimaMatriz.length === this.ultimaMatriz[0].length ? "balanceado" : "desbalanceado",
      rango_costos: {
        minimo: Math.min(...this.ultimaMatriz.flat()),
        maximo: Math.max(...this.ultimaMatriz.flat()),
        promedio: this.ultimaMatriz.flat().reduce((a, b) => a + b, 0) / this.ultimaMatriz.flat().length,
      },
    }

    // Enriquecer el resultado con información contextual
    const resultadoEnriquecido = {
      ...this.ultimoResultado,
      asignaciones_detalladas: this.ultimoResultado.asignaciones.map((asig) => ({
        ...asig,
        trabajador: asig.fila,
        trabajo: asig.columna,
        costo_relativo: ((asig.costo / datosEntrada.rango_costos.promedio) * 100).toFixed(1) + "% del promedio",
      })),
      eficiencia: {
        costo_promedio_por_asignacion: (
          this.ultimoResultado.costo_total / this.ultimoResultado.asignaciones.length
        ).toFixed(2),
        porcentaje_del_maximo:
          (
            (this.ultimoResultado.costo_total /
              (datosEntrada.rango_costos.maximo * this.ultimoResultado.asignaciones.length)) *
            100
          ).toFixed(1) + "%",
      },
    }

    const interpretacion = await window.AIInterpreter.interpretarResultados(
      "hungaro",
      resultadoEnriquecido,
      datosEntrada,
    )
    window.AIInterpreter.mostrarInterpretacion(containerId, interpretacion, "🤖 Interpretación IA - Método Húngaro")
  },

  interpretarSensibilidadIA: async function () {
    if (!this.ultimoResultado || !this.ultimaMatriz) {
      alert("❌ Primero debes realizar el análisis de sensibilidad antes de interpretarlo.")
      return
    }

    const containerId = "interpretacion-sensibilidad-ia-hungaro"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const sensibilidadDiv = document.getElementById("resultados-sensibilidad-hungaro")
      container = document.createElement("div")
      container.id = containerId
      sensibilidadDiv.parentNode.insertBefore(container, sensibilidadDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Interpretando análisis de sensibilidad...")

    // Obtener los últimos resultados de sensibilidad
    const resultadosSensibilidad = this.ultimosResultadosSensibilidad || []

    const interpretacion = await window.AIInterpreter.interpretarSensibilidad(
      "hungaro",
      resultadosSensibilidad,
      this.ultimoResultado,
    )
    window.AIInterpreter.mostrarInterpretacion(
      containerId,
      interpretacion,
      "🤖 Interpretación IA - Análisis de Sensibilidad",
    )
  },
}

// Hacer HungarianMethods disponible globalmente
window.HungarianMethods = HungarianMethods

// Agregar después de setupEventListeners si existe, o crear una función de inicialización
document.getElementById("tipoAnalisis").addEventListener("change", function () {
  const seleccionCosto = document.getElementById("seleccionCosto")
  if (this.value === "individual") {
    seleccionCosto.style.display = "block"
  } else {
    seleccionCosto.style.display = "none"
  }
})
