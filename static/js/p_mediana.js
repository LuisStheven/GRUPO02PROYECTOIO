const ultimoResultado = null

const PMedianaMethods = {
  cantidadFilas: 3,
  cantidadColumnas: 3,

  agregarFila: function () {
    const tabla = document.getElementById("matrizDistancias").getElementsByTagName("tbody")[0]
    const nuevaFila = tabla.insertRow()
    const primeraCelda = nuevaFila.insertCell(0)
    primeraCelda.innerHTML = `Cliente ${this.cantidadFilas + 1} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarFila(${this.cantidadFilas})"><i class="bi bi-pencil-square"></i></button>`

    for (let i = 0; i < this.cantidadColumnas; i++) {
      const celda = nuevaFila.insertCell(i + 1)
      celda.innerHTML =
        '<input type="number" step="any" class="form-control form-control-sm matrix-input" value="0" min="0">'
    }
    this.cantidadFilas++
  },

  agregarColumna: function () {
    const filaEncabezado = document.getElementById("filaEncabezadoDistancias")
    const celdaEncabezado = filaEncabezado.insertCell(filaEncabezado.cells.length)
    celdaEncabezado.innerHTML = `Ubicación ${this.cantidadColumnas + 1} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarColumna(${this.cantidadColumnas})"><i class="bi bi-pencil-square"></i></button>`

    const filas = document.getElementById("matrizDistancias").rows
    for (let i = 1; i < filas.length; i++) {
      const celda = filas[i].insertCell(filas[i].cells.length)
      celda.innerHTML =
        '<input type="number" step="any" class="form-control form-control-sm matrix-input" value="0" min="0">'
    }
    this.cantidadColumnas++
  },

  eliminarFila: function () {
    if (this.cantidadFilas <= 1) {
      alert("Debe haber al menos un cliente")
      return
    }
    const tabla = document.getElementById("matrizDistancias").getElementsByTagName("tbody")[0]
    tabla.deleteRow(tabla.rows.length - 1)
    this.cantidadFilas--
  },

  eliminarColumna: function () {
    if (this.cantidadColumnas <= 1) {
      alert("Debe haber al menos una ubicación")
      return
    }
    const filaEncabezado = document.getElementById("filaEncabezadoDistancias")
    filaEncabezado.deleteCell(filaEncabezado.cells.length - 1)

    const filas = document.getElementById("matrizDistancias").rows
    for (let i = 1; i < filas.length; i++) {
      filas[i].deleteCell(filas[i].cells.length - 1)
    }
    this.cantidadColumnas--
  },

  renombrarFila: (indiceFila) => {
    const nuevoNombre = prompt("Nuevo nombre para el cliente:")
    if (nuevoNombre) {
      const filas = document.getElementById("matrizDistancias").rows
      filas[indiceFila + 1].cells[0].innerHTML =
        `${nuevoNombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarFila(${indiceFila})"><i class="bi bi-pencil-square"></i></button>`
    }
  },

  renombrarColumna: (indiceColumna) => {
    const nuevoNombre = prompt("Nuevo nombre para la ubicación:")
    if (nuevoNombre) {
      const filaEncabezado = document.getElementById("filaEncabezadoDistancias")
      filaEncabezado.cells[indiceColumna + 1].innerHTML =
        `${nuevoNombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarColumna(${indiceColumna})"><i class="bi bi-pencil-square"></i></button>`
    }
  },

  resolver: async () => {
    const tabla = document.getElementById("matrizDistancias")
    const matriz = []
    let hayDatos = false

    // Validar que hay datos ingresados
    for (let i = 1; i < tabla.rows.length; i++) {
      const fila = []
      for (let j = 1; j < tabla.rows[i].cells.length; j++) {
        const input = tabla.rows[i].cells[j].querySelector("input")
        const valor = Number.parseFloat(input.value) || 0

        if (valor < 0) {
          alert("❌ Las distancias no pueden ser negativas.")
          return
        }

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
      document.getElementById("resultado-p-mediana").innerHTML = `
        <div class="alert alert-warning">
          <h4><i class="bi bi-exclamation-triangle"></i> Sin datos</h4>
          <p>Por favor, ingresa los valores en la matriz de distancias antes de resolver el problema.</p>
        </div>
      `
      return
    }

    // Validar número de medianas
    const p = Number.parseInt(document.getElementById("numeroMedianas").value)
    if (!p || p <= 0 || p > matriz.length) {
      alert(`❌ El número de medianas debe estar entre 1 y ${matriz.length}.`)
      return
    }

    // Obtener encabezados
    const etiquetasFilas = Array.from(tabla.rows)
      .slice(1)
      .map((fila) => fila.cells[0].innerText.trim().split("\n")[0])
    const etiquetasEncabezado = Array.from(tabla.rows[0].cells)
      .slice(1)
      .map((celda) => celda.innerText.trim().split("\n")[0])

    // Mostrar loading
    document.getElementById("resultado-p-mediana").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Resolviendo problema P-Mediana...</span>
        </div>
      </div>
    `

    try {
      // Enviar datos al backend
      const response = await fetch("/api/p-mediana", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          distancias: matriz,
          p: p,
          encabezados_filas: etiquetasFilas,
          encabezados_columnas: etiquetasEncabezado,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el servidor")
      }

      // Mostrar resultado
      let htmlResultado = `
        <div class="alert alert-success">
          <h4><i class="bi bi-check-circle"></i> Solución P-Mediana Óptima:</h4>
          
          <div class="row">
            <div class="col-md-6">
              <h5><i class="bi bi-geo-alt-fill"></i> Medianas Seleccionadas:</h5>
              <ul class="list-group list-group-flush">
      `

      resultado.medianas.forEach((mediana) => {
        htmlResultado += `<li class="list-group-item">${mediana.nombre}</li>`
      })

      htmlResultado += `
              </ul>
            </div>
            
            <div class="col-md-6">
              <h5><i class="bi bi-arrow-right-circle"></i> Asignaciones:</h5>
              <ul class="list-group list-group-flush">
      `

      resultado.asignaciones.forEach((asignacion) => {
        htmlResultado += `
          <li class="list-group-item d-flex justify-content-between align-items-center">
            ${asignacion.cliente} → ${asignacion.mediana}
            <span class="badge bg-primary rounded-pill">${asignacion.distancia}</span>
          </li>
        `
      })

      htmlResultado += `
              </ul>
            </div>
          </div>
          
          <div class="mt-3 p-3 bg-light rounded">
            <strong><i class="bi bi-calculator"></i> Costo Total Mínimo: ${resultado.costo_total}</strong>
          </div>
        </div>
      `

      // Agregar botón de interpretación IA
      htmlResultado += `
        <div class="mt-3">
          <button class="btn btn-info btn-sm" onclick="PMedianaMethods.interpretarResultadosIA()">
            <i class="bi bi-robot"></i> Interpretar con IA
          </button>
        </div>
      `

      document.getElementById("resultado-p-mediana").innerHTML = htmlResultado

      // Guardar en el historial
      const Historial = window.Historial
      if (Historial) {
        Historial.guardarPMediana(matriz, etiquetasFilas, etiquetasEncabezado, p, resultado)
      }

      // Guardar datos para análisis de sensibilidad
      PMedianaMethods.ultimaMatriz = matriz
      PMedianaMethods.ultimoResultado = resultado
      PMedianaMethods.ultimoP = p
      PMedianaMethods.ultimosEncabezadosFilas = etiquetasFilas
      PMedianaMethods.ultimosEncabezadosColumnas = etiquetasEncabezado

      console.log("Datos guardados para análisis P-Mediana:", {
        ultimaMatriz: PMedianaMethods.ultimaMatriz,
        ultimoResultado: PMedianaMethods.ultimoResultado,
        ultimoP: PMedianaMethods.ultimoP,
      })

      // Mostrar sección de análisis de sensibilidad
      document.getElementById("analisis-sensibilidad-pmediana").style.display = "block"
    } catch (error) {
      console.error("Error:", error)
      document.getElementById("resultado-p-mediana").innerHTML = `
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

        // Validación y procesamiento similar al método húngaro
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
          nombresFilas = matrizCompleta.slice(1).map((_, i) => `Cliente ${i + 1}`)
          datos = matrizCompleta.slice(1)
        } else if (!tieneEncabezadosColumna && tieneEncabezadosFila) {
          nombresColumnas = matrizCompleta[0].slice(1).map((_, i) => `Ubicación ${i + 1}`)
          nombresFilas = matrizCompleta.map((f) => f[0])
          datos = matrizCompleta.map((fila) => fila.slice(1))
        } else {
          nombresColumnas = matrizCompleta[0].map((_, i) => `Ubicación ${i + 1}`)
          nombresFilas = matrizCompleta.map((_, i) => `Cliente ${i + 1}`)
          datos = matrizCompleta
        }

        // Validar datos numéricos y no negativos
        for (let i = 0; i < datos.length; i++) {
          for (let j = 0; j < datos[i].length; j++) {
            const valor = datos[i][j]
            if (valor == null || valor === "" || isNaN(Number(valor)) || Number(valor) < 0) {
              alert(`❌ Error: La celda en fila ${i + 1}, columna ${j + 1} no contiene un número válido no negativo.`)
              event.target.value = ""
              return
            }
          }
        }

        // Actualizar interfaz
        this.cantidadFilas = datos.length
        this.cantidadColumnas = datos[0].length

        const tabla = document.getElementById("matrizDistancias")
        tabla.innerHTML = ""

        // Crear encabezado
        const thead = tabla.createTHead()
        const filaEncabezado = thead.insertRow()
        filaEncabezado.id = "filaEncabezadoDistancias"
        const thVacio = document.createElement("th")
        filaEncabezado.appendChild(thVacio)

        for (let j = 0; j < this.cantidadColumnas; j++) {
          const th = document.createElement("th")
          const nombre = nombresColumnas[j] ?? `Ubicación ${j + 1}`
          th.innerHTML = `${nombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarColumna(${j})"><i class="bi bi-pencil-square"></i></button>`
          filaEncabezado.appendChild(th)
        }

        // Crear cuerpo
        const tbody = tabla.createTBody()
        for (let i = 0; i < this.cantidadFilas; i++) {
          const row = tbody.insertRow()
          const th = document.createElement("th")
          const nombre = nombresFilas[i] ?? `Cliente ${i + 1}`
          th.innerHTML = `${nombre} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarFila(${i})"><i class="bi bi-pencil-square"></i></button>`
          row.appendChild(th)

          for (let j = 0; j < this.cantidadColumnas; j++) {
            const cell = row.insertCell()
            const val = datos[i][j] != null ? Number(datos[i][j]) : 0
            cell.innerHTML = `<input type="number" class="form-control form-control-sm matrix-input" step="any" value="${val}" min="0">`
          }
        }

        alert("✅ Matriz de distancias cargada correctamente desde Excel.")
      } catch (error) {
        alert(`❌ Error al procesar el archivo Excel: ${error.message}`)
        event.target.value = ""
      }
    }

    reader.readAsArrayBuffer(file)
  },

  borrarDatos: () => {
    const tabla = document.getElementById("matrizDistancias")
    const filas = tabla.querySelectorAll("tbody tr")

    // Limpiar inputs de cada celda
    filas.forEach((fila, i) => {
      const inputs = fila.querySelectorAll("input")
      inputs.forEach((input) => (input.value = "0"))

      // Resetear encabezado de fila
      const th = fila.querySelector("th")
      if (th) {
        th.innerHTML = `Cliente ${i + 1} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarFila(${i})"><i class="bi bi-pencil-square"></i></button>`
      }
    })

    // Limpiar encabezados de columnas
    const encabezados = document.querySelectorAll("#filaEncabezadoDistancias th")
    encabezados.forEach((th, j) => {
      if (j === 0) return
      th.innerHTML = `Ubicación ${j} <button class="btn btn-sm btn-link p-0 ms-1" onclick="PMedianaMethods.renombrarColumna(${j - 1})"><i class="bi bi-pencil-square"></i></button>`
    })

    // Resetear número de medianas
    document.getElementById("numeroMedianas").value = "2"

    // Limpiar resultado
    document.getElementById("resultado-p-mediana").innerHTML = ""
  },

  analizarSensibilidad: async function () {
    console.log("Verificando datos para análisis P-Mediana:", {
      ultimaMatriz: this.ultimaMatriz,
      ultimoResultado: this.ultimoResultado,
      ultimoP: this.ultimoP,
    })

    if (!this.ultimaMatriz || !this.ultimoResultado) {
      alert("❌ Primero debes resolver el problema antes de realizar el análisis de sensibilidad.")
      return
    }

    const porcentaje = Number.parseFloat(document.getElementById("porcentajeVariacionPM").value) || 10
    const tipoAnalisis = document.getElementById("tipoAnalisisPM").value

    // Mostrar loading
    document.getElementById("resultados-sensibilidad-pmediana").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Analizando sensibilidad...</span>
        </div>
      </div>
    `

    try {
      // Usar el nuevo endpoint de análisis de sensibilidad
      const response = await fetch("/api/p-mediana-sensitivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          matriz: this.ultimaMatriz,
          p: this.ultimoP,
          porcentaje: porcentaje,
          tipo: tipoAnalisis,
          encabezados_filas: this.ultimosEncabezadosFilas,
          encabezados_columnas: this.ultimosEncabezadosColumnas,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el análisis")
      }

      this.mostrarResultadosSensibilidadPM(resultado.resultados, tipoAnalisis)
    } catch (error) {
      console.error("Error en análisis de sensibilidad P-Mediana:", error)
      document.getElementById("resultados-sensibilidad-pmediana").innerHTML = `
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
          <p>Error en el análisis: ${error.message}</p>
        </div>
      `
    }
  },

  mostrarResultadosSensibilidadPM: (resultados, tipoAnalisis) => {
    const container = document.getElementById("resultados-sensibilidad-pmediana")

    // Guardar resultados para interpretación IA
    PMedianaMethods.ultimosResultadosSensibilidad = resultados

    let html = `<h6>Resultados del Análisis (Calculado con Python)</h6>`

    if (resultados.distancias && resultados.distancias.length > 0) {
      html += `
            <div class="mb-3">
                <strong>Sensibilidad de Distancias:</strong>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Cliente → Ubicación</th>
                                <th>Distancia Original</th>
                                <th>Distancia Nueva</th>
                                <th>Impacto %</th>
                                <th>Sensibilidad</th>
                            </tr>
                        </thead>
                        <tbody>
        `

      resultados.distancias.forEach((resultado) => {
        const impactoClass =
          resultado.sensibilidad === "Alta"
            ? "text-danger"
            : resultado.sensibilidad === "Media"
              ? "text-warning"
              : "text-success"

        html += `
                <tr>
                    <td>${resultado.cliente} → ${resultado.ubicacion}</td>
                    <td>${resultado.distancia_original.toFixed(2)}</td>
                    <td>${resultado.distancia_nueva.toFixed(2)}</td>
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
            </div>
        `
    }

    if (resultados.p && resultados.p.length > 0) {
      html += `
            <div class="mb-3">
                <strong>Sensibilidad del Número de Medianas:</strong>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>P Original</th>
                                <th>P Nuevo</th>
                                <th>Costo Total</th>
                                <th>Impacto %</th>
                                <th>Sensibilidad</th>
                            </tr>
                        </thead>
                        <tbody>
        `

      resultados.p.forEach((resultado) => {
        const impactoClass =
          resultado.sensibilidad === "Alta"
            ? "text-danger"
            : resultado.sensibilidad === "Media"
              ? "text-warning"
              : "text-success"

        html += `
                <tr>
                    <td>${resultado.p_original}</td>
                    <td>${resultado.p_nuevo}</td>
                    <td>${resultado.costo_nuevo.toFixed(2)}</td>
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
            </div>
        `
    }

    html += `
        <div class="mt-3">
            <button class="btn btn-info btn-sm" onclick="PMedianaMethods.interpretarSensibilidadIA()">
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

    const containerId = "interpretacion-ia-pmediana"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const resultadoDiv = document.getElementById("resultado-p-mediana")
      container = document.createElement("div")
      container.id = containerId
      resultadoDiv.parentNode.insertBefore(container, resultadoDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Analizando resultados con IA...")

    // Preparar datos contextuales más ricos
    const datosEntrada = {
      matriz: this.ultimaMatriz,
      p: this.ultimoP,
      encabezados_filas: this.ultimosEncabezadosFilas,
      encabezados_columnas: this.ultimosEncabezadosColumnas,
      dimensiones: {
        clientes: this.ultimaMatriz.length,
        ubicaciones_posibles: this.ultimaMatriz[0].length,
        ubicaciones_seleccionadas: this.ultimoP,
      },
      estadisticas_distancias: {
        minima: Math.min(...this.ultimaMatriz.flat()),
        maxima: Math.max(...this.ultimaMatriz.flat()),
        promedio: (this.ultimaMatriz.flat().reduce((a, b) => a + b, 0) / this.ultimaMatriz.flat().length).toFixed(2),
      },
      cobertura: {
        porcentaje_ubicaciones_usadas: ((this.ultimoP / this.ultimaMatriz[0].length) * 100).toFixed(1) + "%",
        clientes_por_mediana: (this.ultimaMatriz.length / this.ultimoP).toFixed(1),
      },
    }

    // Enriquecer el resultado con información contextual
    const resultadoEnriquecido = {
      ...this.ultimoResultado,
      medianas_detalladas: this.ultimoResultado.medianas.map((mediana) => ({
        ...mediana,
        clientes_asignados: this.ultimoResultado.asignaciones.filter((asig) => asig.mediana === mediana.nombre).length,
        distancia_promedio:
          this.ultimoResultado.asignaciones
            .filter((asig) => asig.mediana === mediana.nombre)
            .reduce((sum, asig) => sum + asig.distancia, 0) /
            this.ultimoResultado.asignaciones.filter((asig) => asig.mediana === mediana.nombre).length || 0,
      })),
      asignaciones_detalladas: this.ultimoResultado.asignaciones.map((asig) => ({
        ...asig,
        distancia_relativa:
          ((asig.distancia / datosEntrada.estadisticas_distancias.promedio) * 100).toFixed(1) + "% del promedio",
      })),
      eficiencia: {
        distancia_promedio_por_cliente: (this.ultimoResultado.costo_total / this.ultimaMatriz.length).toFixed(2),
        ahorro_vs_peor_caso: {
          peor_distancia_posible: Math.max(...this.ultimaMatriz.flat()) * this.ultimaMatriz.length,
          ahorro_absoluto: (
            Math.max(...this.ultimaMatriz.flat()) * this.ultimaMatriz.length -
            this.ultimoResultado.costo_total
          ).toFixed(2),
          ahorro_porcentual:
            (
              ((Math.max(...this.ultimaMatriz.flat()) * this.ultimaMatriz.length - this.ultimoResultado.costo_total) /
                (Math.max(...this.ultimaMatriz.flat()) * this.ultimaMatriz.length)) *
              100
            ).toFixed(1) + "%",
        },
      },
    }

    const interpretacion = await window.AIInterpreter.interpretarResultados(
      "p-mediana",
      resultadoEnriquecido,
      datosEntrada,
    )
    window.AIInterpreter.mostrarInterpretacion(containerId, interpretacion, "🤖 Interpretación IA - P-Mediana")
  },

  interpretarSensibilidadIA: async function () {
    if (!this.ultimoResultado || !this.ultimaMatriz) {
      alert("❌ Primero debes realizar el análisis de sensibilidad antes de interpretarlo.")
      return
    }

    const containerId = "interpretacion-sensibilidad-ia-pmediana"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const sensibilidadDiv = document.getElementById("resultados-sensibilidad-pmediana")
      container = document.createElement("div")
      container.id = containerId
      sensibilidadDiv.parentNode.insertBefore(container, sensibilidadDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Interpretando análisis de sensibilidad...")

    const resultadosSensibilidad = this.ultimosResultadosSensibilidad || {}

    const interpretacion = await window.AIInterpreter.interpretarSensibilidad(
      "p-mediana",
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

// Hacer PMedianaMethods disponible globalmente
window.PMedianaMethods = PMedianaMethods

function agregarFila() {
  PMedianaMethods.agregarFila()
}

function agregarColumna() {
  PMedianaMethods.agregarColumna()
}

function eliminarFila() {
  PMedianaMethods.eliminarFila()
}

function eliminarColumna() {
  PMedianaMethods.eliminarColumna()
}

function limpiarMatriz() {
  PMedianaMethods.borrarDatos()
}

function cargarEjemplo() {
  // Limpiar matriz actual
  limpiarMatriz()

  // Datos de ejemplo: 5 clientes, 5 ubicaciones posibles
  const ejemploDistancias = [
    [0, 10, 15, 20, 25],
    [10, 0, 35, 25, 30],
    [15, 35, 0, 30, 20],
    [20, 25, 30, 0, 15],
    [25, 30, 20, 15, 0],
  ]

  const ejemploClientes = ["Cliente A", "Cliente B", "Cliente C", "Cliente D", "Cliente E"]
  const ejemploUbicaciones = ["Zona Norte", "Zona Sur", "Zona Este", "Zona Oeste", "Centro"]

  // Ajustar tamaño de matriz
  const tabla = document.getElementById("matrizDistancias")
  const filasActuales = tabla.rows.length - 1
  const columnasActuales = tabla.rows[0].cells.length - 1

  // Agregar filas si es necesario
  while (filasActuales < ejemploDistancias.length) {
    agregarFila()
  }

  // Agregar columnas si es necesario
  while (columnasActuales < ejemploDistancias[0].length) {
    agregarColumna()
  }

  // Cargar datos
  for (let i = 0; i < ejemploDistancias.length; i++) {
    for (let j = 0; j < ejemploDistancias[i].length; j++) {
      const input = tabla.rows[i + 1].cells[j + 1].querySelector("input")
      if (input) {
        input.value = ejemploDistancias[i][j]
      }
    }
  }

  // Cargar encabezados
  ejemploClientes.forEach((cliente, index) => {
    const input = document.getElementById(`encabezado-fila-${index}`)
    if (input) {
      input.value = cliente
    }
  })

  ejemploUbicaciones.forEach((ubicacion, index) => {
    const input = document.getElementById(`encabezado-columna-${index}`)
    if (input) {
      input.value = ubicacion
    }
  })

  // Establecer P = 2
  document.getElementById("numeroMedianas").value = "2"
}

async function cargarDesdeExcel() {
  const input = document.createElement("input")
  input.type = "file"
  input.accept = ".xlsx,.xls,.csv"

  input.onchange = async (e) => {
    PMedianaMethods.cargarDesdeExcel(e)
  }

  input.click()
}

async function resolverPMediana() {
  PMedianaMethods.resolver()
}

async function analizarSensibilidadPMediana() {
  PMedianaMethods.analizarSensibilidad()
}

function mostrarResultado(resultado) {
  // Implementación ya está en PMedianaMethods.resolver
}

function mostrarAnalisisSensibilidadPMediana(resultado) {
  // Implementación ya está en PMedianaMethods.analizarSensibilidad
}
