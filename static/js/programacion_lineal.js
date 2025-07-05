const LinearProgramming = {
  variables: ["x", "y"],

  setupEventListeners: () => {
    // Mostrar/ocultar opciones de Branch & Bound
    document.getElementById("branchBoundCheck").addEventListener("change", function () {
      const options = document.getElementById("branchBoundOptions")
      if (this.checked) {
        options.style.display = "block"
      } else {
        options.style.display = "none"
      }
    })
  },

  agregarVariable: function () {
    const nextLetter = String.fromCharCode(120 + this.variables.length)
    this.variables.push(nextLetter)
    this.actualizarInterfaz()
  },

  eliminarVariable: function () {
    if (this.variables.length <= 1) {
      alert("Debe haber al menos una variable")
      return
    }
    this.variables.pop()
    this.actualizarInterfaz()
  },

  agregarRestriccion: function () {
    const container = document.getElementById("restricciones-container")
    const nuevaRestriccion = this.crearFilaRestriccion()
    container.appendChild(nuevaRestriccion)
  },

  eliminarRestriccion: () => {
    const container = document.getElementById("restricciones-container")
    if (container.children.length <= 1) {
      alert("Debe haber al menos una restricción")
      return
    }
    container.removeChild(container.lastElementChild)
  },

  crearFilaRestriccion: function () {
    const div = document.createElement("div")
    div.className = "restriccion-row mb-3 d-flex flex-wrap align-items-center gap-2"

    let html = ""
    this.variables.forEach((variable, index) => {
      if (index > 0) html += "<span>+</span>"
      html += `
        <input type="number" step="any" class="form-control form-control-sm restriccion-coef" style="width: 80px;" placeholder="0" data-variable="${variable}">
        <span>${variable}</span>
      `
    })

    html += `
      <select class="form-select form-select-sm restriccion-operador" style="width: 80px;">
        <option value="<=">&le;</option>
        <option value=">=">&ge;</option>
        <option value="=">=</option>
      </select>
      <input type="number" step="any" class="form-control form-control-sm restriccion-valor" style="width: 80px;" placeholder="0">
    `

    div.innerHTML = html
    return div
  },

  actualizarInterfaz: function () {
    // Actualizar función objetivo
    const variablesContainer = document.getElementById("variables-container")
    let html = '<span class="fw-bold">Z =</span>'

    this.variables.forEach((variable, index) => {
      if (index > 0) html += "<span>+</span>"
      html += `
        <input type="number" step="any" class="form-control form-control-sm variable-coef" style="width: 80px;" placeholder="0" data-variable="${variable}">
        <span>${variable}</span>
      `
    })

    variablesContainer.innerHTML = html

    // Actualizar restricciones existentes
    const restriccionesContainer = document.getElementById("restricciones-container")
    const restricciones = Array.from(restriccionesContainer.children)

    restricciones.forEach((restriccion) => {
      restriccion.remove()
    })

    // Crear nuevas restricciones con las variables actualizadas
    for (let i = 0; i < Math.max(2, restricciones.length); i++) {
      restriccionesContainer.appendChild(this.crearFilaRestriccion())
    }
  },

  resolver: async function () {
    try {
      const objetivo = document.getElementById("objetivo").value
      const branchBound = document.getElementById("branchBoundCheck").checked
      const mostrarArbol = document.getElementById("mostrarArbolCheck").checked

      // Validar función objetivo
      const funcionObjetivo = {}
      const variableCoefs = document.querySelectorAll(".variable-coef")
      let hayFuncionObjetivo = false

      variableCoefs.forEach((input) => {
        const variable = input.dataset.variable
        const coef = Number.parseFloat(input.value) || 0
        funcionObjetivo[variable] = coef

        if (coef !== 0) {
          hayFuncionObjetivo = true
        }
      })

      // Validar restricciones
      const restriccionesRows = document.querySelectorAll(".restriccion-row")
      const restriccionesData = []
      let hayRestricciones = false

      restriccionesRows.forEach((row) => {
        const coefs = row.querySelectorAll(".restriccion-coef")
        const operador = row.querySelector(".restriccion-operador").value
        const valor = Number.parseFloat(row.querySelector(".restriccion-valor").value) || 0

        const restriccionInfo = {
          coeficientes: {},
          operador: operador,
          valor: valor,
        }

        let hayCoeficientes = false
        coefs.forEach((input) => {
          const variable = input.dataset.variable
          const coef = Number.parseFloat(input.value) || 0
          restriccionInfo.coeficientes[variable] = coef

          if (coef !== 0) {
            hayCoeficientes = true
          }
        })

        if (hayCoeficientes && valor !== 0) {
          restriccionesData.push(restriccionInfo)
          hayRestricciones = true
        }
      })

      // Validaciones
      if (!hayFuncionObjetivo) {
        alert("❌ Por favor, ingresa al menos un coeficiente diferente de cero en la función objetivo.")
        document.getElementById("resultado_lp").innerHTML = `
        <div class="alert alert-warning">
          <h4><i class="bi bi-exclamation-triangle"></i> Sin función objetivo</h4>
          <p>Por favor, ingresa los coeficientes de la función objetivo antes de resolver.</p>
        </div>
      `
        return
      }

      if (!hayRestricciones) {
        alert("❌ Por favor, ingresa al menos una restricción válida.")
        document.getElementById("resultado_lp").innerHTML = `
        <div class="alert alert-warning">
          <h4><i class="bi bi-exclamation-triangle"></i> Sin restricciones</h4>
          <p>Por favor, ingresa al menos una restricción válida antes de resolver.</p>
        </div>
      `
        return
      }

      const noNegatividadCheck = document.getElementById("noNegatividadCheck").checked

      // Mostrar loading
      document.getElementById("resultado_lp").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Resolviendo problema${branchBound ? " con Branch & Bound" : ""}...</span>
        </div>
      </div>
    `

      // Seleccionar endpoint según el método
      const endpoint = branchBound ? "/api/branch-bound" : "/api/linear-programming"

      // Enviar al backend
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables: this.variables,
          funcion_objetivo: funcionObjetivo,
          restricciones: restriccionesData,
          objetivo: objetivo,
          no_negatividad: noNegatividadCheck,
          mostrar_arbol: mostrarArbol,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el servidor")
      }

      // Mostrar resultado
      this.mostrarResultado(resultado, branchBound)

      // Guardar datos para análisis de sensibilidad
      LinearProgramming.ultimosDatos = {
        variables: this.variables,
        funcion_objetivo: funcionObjetivo,
        restricciones: restriccionesData,
        objetivo: objetivo,
        no_negatividad: noNegatividadCheck,
        branch_bound: branchBound,
      }
      LinearProgramming.ultimoResultado = resultado

      console.log("Datos guardados para análisis LP:", {
        ultimosDatos: LinearProgramming.ultimosDatos,
        ultimoResultado: LinearProgramming.ultimoResultado,
      })

      // Mostrar sección de análisis de sensibilidad
      document.getElementById("analisis-sensibilidad-lp").style.display = "block"

      // Guardar en el historial
      const Historial = window.Historial
      if (Historial) {
        Historial.guardarProgramacionLineal(this.variables, funcionObjetivo, restriccionesData, objetivo, resultado)
      }
    } catch (error) {
      console.error("Error:", error)
      document.getElementById("resultado_lp").innerHTML = `
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
          <p>Error al resolver: ${error.message}</p>
        </div>
      `
    }
  },

  mostrarResultado: function (resultado, esBranchBound) {
    const output = []
    for (const variable in resultado.solucion) {
      if (this.variables.includes(variable)) {
        const valor = esBranchBound ? Math.round(resultado.solucion[variable]) : resultado.solucion[variable].toFixed(4)
        output.push(`${variable} = ${valor}`)
      }
    }

    const tipoSolucion = esBranchBound ? "Solución Entera Óptima" : "Solución"
    const metodo = esBranchBound ? "Branch & Bound" : "Programación Lineal"

    document.getElementById("resultado_lp").innerHTML = `
      <div class="alert alert-success">
        <h4><i class="bi bi-check-circle"></i> ${tipoSolucion} (${metodo}):</h4>
        <pre>${output.join("\n")}</pre>
        <strong>Resultado óptimo: ${resultado.valor_objetivo.toFixed(4)}</strong>
        ${esBranchBound ? `<br><small class="text-muted">Nodos explorados: ${resultado.nodos_explorados || "N/A"}</small>` : ""}
        <div class="mt-2">
          <button class="btn btn-info btn-sm" onclick="LinearProgramming.interpretarResultadosIA()">
            <i class="bi bi-robot"></i> Interpretar con IA
          </button>
        </div>
      </div>
    `

    // Mostrar árbol si es Branch & Bound y se solicitó
    if (esBranchBound && resultado.arbol && document.getElementById("mostrarArbolCheck").checked) {
      this.mostrarArbolBranchBound(resultado.arbol)
    }
  },

  mostrarArbolBranchBound: (arbol) => {
    const container = document.getElementById("tree-container")
    const arbolDiv = document.getElementById("arbol-branch-bound")

    arbolDiv.style.display = "block"

    let html = `
      <div class="tree-visualization">
        <style>
          .tree-node {
            background: #f8f9fa;
            border: 2px solid #dee2e6;
            border-radius: 8px;
            padding: 10px;
            margin: 5px;
            display: inline-block;
            min-width: 120px;
            text-align: center;
            font-size: 12px;
          }
          .tree-node.optimal {
            border-color: #28a745;
            background: #d4edda;
          }
          .tree-node.infeasible {
            border-color: #dc3545;
            background: #f8d7da;
          }
          .tree-node.pruned {
            border-color: #ffc107;
            background: #fff3cd;
          }
          .tree-level {
            margin: 20px 0;
            text-align: center;
          }
          .tree-connection {
            width: 2px;
            height: 20px;
            background: #6c757d;
            margin: 0 auto;
          }
        </style>
    `

    // Generar árbol nivel por nivel
    if (arbol && arbol.length > 0) {
      arbol.forEach((nivel, index) => {
        html += `<div class="tree-level">`
        html += `<h6>Nivel ${index}</h6>`

        nivel.forEach((nodo) => {
          let claseNodo = "tree-node"
          if (nodo.es_optimo) claseNodo += " optimal"
          else if (nodo.infactible) claseNodo += " infeasible"
          else if (nodo.podado) claseNodo += " pruned"

          html += `
            <div class="${claseNodo}">
              <strong>Nodo ${nodo.id}</strong><br>
              ${nodo.restriccion ? `${nodo.restriccion}<br>` : ""}
              Z = ${nodo.valor_objetivo ? nodo.valor_objetivo.toFixed(2) : "N/A"}<br>
              ${
                nodo.solucion
                  ? Object.entries(nodo.solucion)
                      .map(([k, v]) => `${k}=${v.toFixed(2)}`)
                      .join(", ")
                  : ""
              }
              ${nodo.es_optimo ? '<br><span class="badge bg-success">ÓPTIMO</span>' : ""}
              ${nodo.infactible ? '<br><span class="badge bg-danger">INFACTIBLE</span>' : ""}
              ${nodo.podado ? '<br><span class="badge bg-warning">PODADO</span>' : ""}
            </div>
          `
        })

        html += `</div>`
        if (index < arbol.length - 1) {
          html += `<div class="tree-connection"></div>`
        }
      })
    } else {
      html += `<p class="text-muted">No se pudo generar el árbol de ramificaciones.</p>`
    }

    html += `</div>`
    container.innerHTML = html
  },

  borrarDatos: () => {
    // Limpiar función objetivo
    document.querySelectorAll(".variable-coef").forEach((input) => {
      input.value = ""
    })

    // Limpiar restricciones
    document.querySelectorAll(".restriccion-coef, .restriccion-valor").forEach((input) => {
      input.value = ""
    })

    // Resetear operadores
    document.querySelectorAll(".restriccion-operador").forEach((select) => {
      select.value = "<="
    })

    // Limpiar resultado
    document.getElementById("resultado_lp").innerHTML = ""
  },

  analizarSensibilidad: async function () {
    console.log("Verificando datos para análisis LP:", {
      ultimosDatos: this.ultimosDatos,
      ultimoResultado: this.ultimoResultado,
    })

    if (!this.ultimosDatos || !this.ultimoResultado) {
      alert("❌ Primero debes resolver el problema antes de realizar el análisis de sensibilidad.")
      return
    }

    const porcentaje = Number.parseFloat(document.getElementById("porcentajeVariacionLP").value) || 10
    const tipoAnalisis = document.getElementById("tipoAnalisisLP").value

    // Mostrar loading
    document.getElementById("resultados-sensibilidad-lp").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Analizando sensibilidad...</span>
        </div>
      </div>
    `

    try {
      // Usar el nuevo endpoint de análisis de sensibilidad
      const response = await fetch("/api/linear-programming-sensitivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables: this.ultimosDatos.variables,
          funcion_objetivo: this.ultimosDatos.funcion_objetivo,
          restricciones: this.ultimosDatos.restricciones,
          objetivo: this.ultimosDatos.objetivo,
          no_negatividad: this.ultimosDatos.no_negatividad,
          porcentaje: porcentaje,
          tipo: tipoAnalisis,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el análisis")
      }

      this.mostrarResultadosSensibilidadLP(resultado.resultados, tipoAnalisis)
    } catch (error) {
      console.error("Error en análisis de sensibilidad:", error)
      document.getElementById("resultados-sensibilidad-lp").innerHTML = `
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
          <p>Error en el análisis: ${error.message}</p>
        </div>
      `
    }
  },

  mostrarResultadosSensibilidadLP: (resultados, tipoAnalisis) => {
    const container = document.getElementById("resultados-sensibilidad-lp")

    // Guardar resultados para interpretación IA
    LinearProgramming.ultimosResultadosSensibilidad = resultados

    let html = `<h6>Resultados del Análisis</h6>`

    if (resultados.objetivo && resultados.objetivo.length > 0) {
      html += `
            <div class="mb-3">
                <strong>Sensibilidad de la Función Objetivo:</strong>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Variable</th>
                                <th>Variación</th>
                                <th>Impacto %</th>
                            </tr>
                        </thead>
                        <tbody>
        `

      // Mostrar solo los más significativos
      const significativos = resultados.objetivo
        .sort((a, b) => Math.abs(b.impacto_porcentual) - Math.abs(a.impacto_porcentual))
        .slice(0, 8)

      significativos.forEach((resultado) => {
        const impactoClass =
          Math.abs(resultado.impacto_porcentual) > 10
            ? "text-danger"
            : Math.abs(resultado.impacto_porcentual) > 5
              ? "text-warning"
              : "text-success"

        html += `
                <tr>
                    <td>${resultado.variable}</td>
                    <td>${resultado.variacion > 0 ? "+" : ""}${resultado.variacion}%</td>
                    <td class="${impactoClass}">
                        ${resultado.impacto_porcentual > 0 ? "+" : ""}${resultado.impacto_porcentual.toFixed(2)}%
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

    if (resultados.restricciones && resultados.restricciones.length > 0) {
      html += `
            <div class="mb-3">
                <strong>Sensibilidad de las Restricciones:</strong>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Restricción</th>
                                <th>Variación</th>
                                <th>Impacto %</th>
                            </tr>
                        </thead>
                        <tbody>
        `

      resultados.restricciones.forEach((resultado) => {
        const impactoClass =
          Math.abs(resultado.impacto_porcentual) > 10
            ? "text-danger"
            : Math.abs(resultado.impacto_porcentual) > 5
              ? "text-warning"
              : "text-success"

        html += `
                <tr>
                    <td>R${resultado.restriccion}</td>
                    <td>${resultado.variacion > 0 ? "+" : ""}${resultado.variacion}%</td>
                    <td class="${impactoClass}">
                        ${resultado.impacto_porcentual > 0 ? "+" : ""}${resultado.impacto_porcentual.toFixed(2)}%
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
            <button class="btn btn-info btn-sm" onclick="LinearProgramming.interpretarSensibilidadIA()">
                <i class="bi bi-robot"></i> Interpretar con IA
            </button>
        </div>
    `

    container.innerHTML = html
  },

  // ==================== FUNCIONES DE IA ====================

  interpretarResultadosIA: async function () {
    if (!this.ultimoResultado || !this.ultimosDatos) {
      alert("❌ Primero debes resolver el problema antes de interpretar los resultados.")
      return
    }

    const containerId = "interpretacion-ia-lp"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const resultadoDiv = document.getElementById("resultado_lp")
      container = document.createElement("div")
      container.id = containerId
      resultadoDiv.parentNode.insertBefore(container, resultadoDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Analizando resultados con IA...")

    const metodo = this.ultimosDatos.branch_bound ? "branch-bound" : "programacion-lineal"
    const interpretacion = await window.AIInterpreter.interpretarResultados(
      metodo,
      this.ultimoResultado,
      this.ultimosDatos,
    )
    window.AIInterpreter.mostrarInterpretacion(
      containerId,
      interpretacion,
      `🤖 Interpretación IA - ${metodo === "branch-bound" ? "Branch & Bound" : "Programación Lineal"}`,
    )
  },

  interpretarSensibilidadIA: async function () {
    if (!this.ultimoResultado || !this.ultimosDatos) {
      alert("❌ Primero debes realizar el análisis de sensibilidad antes de interpretarlo.")
      return
    }

    const containerId = "interpretacion-sensibilidad-ia-lp"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const sensibilidadDiv = document.getElementById("resultados-sensibilidad-lp")
      container = document.createElement("div")
      container.id = containerId
      sensibilidadDiv.parentNode.insertBefore(container, sensibilidadDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Interpretando análisis de sensibilidad...")

    const resultadosSensibilidad = this.ultimosResultadosSensibilidad || {}
    const metodo = this.ultimosDatos.branch_bound ? "branch-bound" : "programacion-lineal"

    const interpretacion = await window.AIInterpreter.interpretarSensibilidad(
      metodo,
      resultadosSensibilidad,
      this.ultimoResultado,
    )
    window.AIInterpreter.mostrarInterpretacion(
      containerId,
      interpretacion,
      "🤖 Interpretación IA - Análisis de Sensibilidad",
    )
  },

  init: function () {
    this.setupEventListeners()
  },
}

// Hacer LinearProgramming disponible globalmente
window.LinearProgramming = LinearProgramming

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  LinearProgramming.init()
})
