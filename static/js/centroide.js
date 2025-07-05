const CentroideMethods = {
  points: [],
  centroid: null,
  canvasSize: { width: 600, height: 600 },
  padding: 50,
  minX: -10,
  maxX: 10,
  minY: -10,
  maxY: 10,
  colors: [
    "#e74c3c",
    "#3498db",
    "#2ecc71",
    "#f39c12",
    "#9b59b6",
    "#1abc9c",
    "#e67e22",
    "#34495e",
    "#f1c40f",
    "#e91e63",
  ],
  isDragging: false,
  dragStart: { x: 0, y: 0 },
  initialBounds: { minX: -10, maxX: 10, minY: -10, maxY: 10 },

  init: function () {
    this.setupEventListeners()
    this.drawCanvas()
  },

  setupEventListeners: function () {
    // Botones principales
    document.getElementById("addPointButton").addEventListener("click", () => this.addPointFromForm())
    document.getElementById("solveCentroid").addEventListener("click", () => this.solveCentroid())
    document.getElementById("resetAll").addEventListener("click", () => this.showConfirmModal())
    document.getElementById("confirmYes").addEventListener("click", () => this.resetAll())
    document.getElementById("confirmNo").addEventListener("click", () => this.hideConfirmModal())

    // Canvas interactivo
    const canvas = document.getElementById("cartesianCanvas")

    // Zoom con rueda del mouse
    canvas.addEventListener("wheel", (event) => {
      event.preventDefault()
      const zoomFactor = event.deltaY < 0 ? 0.9 : 1.1
      this.zoom(zoomFactor)
    })

    // Arrastre del canvas
    canvas.addEventListener("mousedown", (e) => {
      this.isDragging = true
      this.dragStart = { x: e.clientX, y: e.clientY }
      this.initialBounds = {
        minX: this.minX,
        maxX: this.maxX,
        minY: this.minY,
        maxY: this.maxY,
      }
      canvas.style.cursor = "grabbing"
    })

    canvas.addEventListener("mousemove", (e) => {
      if (this.isDragging) {
        const dx = e.clientX - this.dragStart.x
        const dy = e.clientY - this.dragStart.y
        const scaleX = (this.initialBounds.maxX - this.initialBounds.minX) / (this.canvasSize.width - 2 * this.padding)
        const scaleY = (this.initialBounds.maxY - this.initialBounds.minY) / (this.canvasSize.height - 2 * this.padding)

        this.minX = this.initialBounds.minX - dx * scaleX
        this.maxX = this.initialBounds.maxX - dx * scaleX
        this.minY = this.initialBounds.minY + dy * scaleY
        this.maxY = this.initialBounds.maxY + dy * scaleY

        this.drawCanvas()
      }

      // Tooltip para puntos
      const target = e.target
      const tooltip = document.getElementById("tooltip")

      if (target.classList.contains("data-point")) {
        const name = target.getAttribute("data-name")
        const x = target.getAttribute("data-x")
        const y = target.getAttribute("data-y")
        const cost = target.getAttribute("data-cost")

        tooltip.innerHTML = `
          <strong>${name}</strong><br>
          Coordenadas: (${x}, ${y})<br>
          Costo: ${cost}
        `

        const rect = canvas.getBoundingClientRect()
        tooltip.style.left = `${e.clientX - rect.left + 10}px`
        tooltip.style.top = `${e.clientY - rect.top - 10}px`
        tooltip.style.display = "block"
      } else {
        tooltip.style.display = "none"
      }
    })

    canvas.addEventListener("mouseup", () => {
      this.isDragging = false
      canvas.style.cursor = "crosshair"
    })

    canvas.addEventListener("mouseleave", () => {
      this.isDragging = false
      canvas.style.cursor = "crosshair"
      document.getElementById("tooltip").style.display = "none"
    })

    // Click en canvas para agregar puntos
    canvas.addEventListener("click", (e) => {
      if (!this.isDragging) {
        this.addPointFromCanvas(e)
      }
    })

    // Enter key en inputs
    ;["pointName", "xCoordinate", "yCoordinate", "transportCost"].forEach((id) => {
      document.getElementById(id).addEventListener("keypress", (e) => {
        if (e.key === "Enter") this.addPointFromForm()
      })
    })
  },

  toCanvasX: function (x) {
    return this.padding + (x - this.minX) * ((this.canvasSize.width - 2 * this.padding) / (this.maxX - this.minX))
  },

  toCanvasY: function (y) {
    return (
      this.canvasSize.height -
      (this.padding + (y - this.minY) * ((this.canvasSize.height - 2 * this.padding) / (this.maxY - this.minY)))
    )
  },

  fromCanvasX: function (canvasX) {
    return this.minX + ((canvasX - this.padding) * (this.maxX - this.minX)) / (this.canvasSize.width - 2 * this.padding)
  },

  fromCanvasY: function (canvasY) {
    return (
      this.maxY - ((canvasY - this.padding) * (this.maxY - this.minY)) / (this.canvasSize.height - 2 * this.padding)
    )
  },

  adjustBounds: function () {
    if (this.points.length === 0) {
      this.minX = -10
      this.maxX = 10
      this.minY = -10
      this.maxY = 10
      return
    }

    const xs = this.points.map((p) => p.x)
    const ys = this.points.map((p) => p.y)
    const margin = 2

    const rawMinX = Math.min(...xs)
    const rawMaxX = Math.max(...xs)
    const rawMinY = Math.min(...ys)
    const rawMaxY = Math.max(...ys)

    let rangeX = rawMaxX - rawMinX
    let rangeY = rawMaxY - rawMinY

    if (rangeX === 0) rangeX = 4
    if (rangeY === 0) rangeY = 4

    const maxRange = Math.max(rangeX, rangeY)
    const centerX = (rawMinX + rawMaxX) / 2
    const centerY = (rawMinY + rawMaxY) / 2

    this.minX = centerX - maxRange / 2 - margin
    this.maxX = centerX + maxRange / 2 + margin
    this.minY = centerY - maxRange / 2 - margin
    this.maxY = centerY + maxRange / 2 + margin
  },

  zoom: function (scale) {
    const centerX = (this.minX + this.maxX) / 2
    const centerY = (this.minY + this.maxY) / 2
    const newWidth = (this.maxX - this.minX) * scale
    const newHeight = (this.maxY - this.minY) * scale

    this.minX = centerX - newWidth / 2
    this.maxX = centerX + newWidth / 2
    this.minY = centerY - newHeight / 2
    this.maxY = centerY + newHeight / 2

    this.drawCanvas()
  },

  drawCanvas: function () {
    const svg = document.getElementById("cartesianCanvas")
    svg.innerHTML = ""
    svg.setAttribute("width", this.canvasSize.width)
    svg.setAttribute("height", this.canvasSize.height)

    this.drawAxes()
    this.drawGrid()
    this.drawPoints()

    if (this.centroid) {
      this.drawCentroid()
    }
  },

  drawGrid: function () {
    const svg = document.getElementById("cartesianCanvas")
    const step = this.calculateGridStep()

    // Líneas verticales
    for (let x = Math.ceil(this.minX / step) * step; x <= this.maxX; x += step) {
      const xPos = this.toCanvasX(x)
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      line.setAttribute("x1", xPos)
      line.setAttribute("y1", this.padding)
      line.setAttribute("x2", xPos)
      line.setAttribute("y2", this.canvasSize.height - this.padding)
      line.setAttribute("stroke", "#e0e0e0")
      line.setAttribute("stroke-width", "1")
      line.setAttribute("opacity", "0.5")
      svg.appendChild(line)
    }

    // Líneas horizontales
    for (let y = Math.ceil(this.minY / step) * step; y <= this.maxY; y += step) {
      const yPos = this.toCanvasY(y)
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line")
      line.setAttribute("x1", this.padding)
      line.setAttribute("y1", yPos)
      line.setAttribute("x2", this.canvasSize.width - this.padding)
      line.setAttribute("y2", yPos)
      line.setAttribute("stroke", "#e0e0e0")
      line.setAttribute("stroke-width", "1")
      line.setAttribute("opacity", "0.5")
      svg.appendChild(line)
    }
  },

  drawAxes: function () {
    const svg = document.getElementById("cartesianCanvas")
    const xZero = this.toCanvasY(0)
    const yZero = this.toCanvasX(0)

    // Eje X
    const xAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    xAxis.setAttribute("x1", this.padding)
    xAxis.setAttribute("y1", xZero)
    xAxis.setAttribute("x2", this.canvasSize.width - this.padding)
    xAxis.setAttribute("y2", xZero)
    xAxis.setAttribute("stroke", "#333")
    xAxis.setAttribute("stroke-width", "2")
    svg.appendChild(xAxis)

    // Eje Y
    const yAxis = document.createElementNS("http://www.w3.org/2000/svg", "line")
    yAxis.setAttribute("x1", yZero)
    yAxis.setAttribute("y1", this.padding)
    yAxis.setAttribute("x2", yZero)
    yAxis.setAttribute("y2", this.canvasSize.height - this.padding)
    yAxis.setAttribute("stroke", "#333")
    yAxis.setAttribute("stroke-width", "2")
    svg.appendChild(yAxis)

    // Etiquetas de los ejes
    const step = this.calculateGridStep()

    // Etiquetas X
    for (let x = Math.ceil(this.minX / step) * step; x <= this.maxX; x += step) {
      if (Math.abs(x) > 0.001) {
        const xPos = this.toCanvasX(x)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
        text.setAttribute("x", xPos)
        text.setAttribute("y", xZero + 20)
        text.setAttribute("text-anchor", "middle")
        text.setAttribute("font-size", "12")
        text.setAttribute("fill", "#666")
        text.textContent = x.toFixed(x % 1 === 0 ? 0 : 1)
        svg.appendChild(text)
      }
    }

    // Etiquetas Y
    for (let y = Math.ceil(this.minY / step) * step; y <= this.maxY; y += step) {
      if (Math.abs(y) > 0.001) {
        const yPos = this.toCanvasY(y)
        const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
        text.setAttribute("x", yZero - 10)
        text.setAttribute("y", yPos + 4)
        text.setAttribute("text-anchor", "end")
        text.setAttribute("font-size", "12")
        text.setAttribute("fill", "#666")
        text.textContent = y.toFixed(y % 1 === 0 ? 0 : 1)
        svg.appendChild(text)
      }
    }
  },

  calculateGridStep: function () {
    const range = Math.max(this.maxX - this.minX, this.maxY - this.minY)
    if (range <= 10) return 1
    if (range <= 50) return 5
    if (range <= 100) return 10
    if (range <= 500) return 50
    return 100
  },

  drawPoints: function () {
    const svg = document.getElementById("cartesianCanvas")

    this.points.forEach((point, index) => {
      const cx = this.toCanvasX(point.x)
      const cy = this.toCanvasY(point.y)
      const color = this.colors[index % this.colors.length]

      // Círculo del punto
      const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
      circle.setAttribute("cx", cx)
      circle.setAttribute("cy", cy)
      circle.setAttribute("r", 8)
      circle.setAttribute("fill", color)
      circle.setAttribute("stroke", "#333")
      circle.setAttribute("stroke-width", "2")
      circle.setAttribute("class", "data-point")
      circle.setAttribute("data-name", point.name)
      circle.setAttribute("data-x", point.x)
      circle.setAttribute("data-y", point.y)
      circle.setAttribute("data-cost", point.cost)
      circle.style.cursor = "pointer"
      svg.appendChild(circle)

      // Etiqueta del punto
      const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
      text.setAttribute("x", cx + 12)
      text.setAttribute("y", cy - 8)
      text.setAttribute("font-size", "12")
      text.setAttribute("font-weight", "bold")
      text.setAttribute("fill", "#333")
      text.textContent = point.name
      svg.appendChild(text)
    })
  },

  drawCentroid: function () {
    if (!this.centroid) return

    const svg = document.getElementById("cartesianCanvas")
    const cx = this.toCanvasX(this.centroid.x)
    const cy = this.toCanvasY(this.centroid.y)

    // Cuadrado del centroide
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect")
    rect.setAttribute("x", cx - 8)
    rect.setAttribute("y", cy - 8)
    rect.setAttribute("width", 16)
    rect.setAttribute("height", 16)
    rect.setAttribute("fill", "#e74c3c")
    rect.setAttribute("stroke", "#c0392b")
    rect.setAttribute("stroke-width", "3")
    rect.setAttribute("class", "centroid-marker")
    svg.appendChild(rect)

    // Etiqueta del centroide
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text")
    text.setAttribute("x", cx + 12)
    text.setAttribute("y", cy - 8)
    text.setAttribute("font-size", "12")
    text.setAttribute("font-weight", "bold")
    text.setAttribute("fill", "#e74c3c")
    text.textContent = "CENTROIDE"
    svg.appendChild(text)
  },

  addPointFromForm: function () {
    const name = document.getElementById("pointName").value.trim()
    const x = Number.parseFloat(document.getElementById("xCoordinate").value)
    const y = Number.parseFloat(document.getElementById("yCoordinate").value)
    const cost = Number.parseFloat(document.getElementById("transportCost").value)

    if (!name) {
      alert("❌ Por favor, ingresa un nombre para el punto.")
      return
    }

    if (isNaN(x) || isNaN(y) || isNaN(cost)) {
      alert("❌ Por favor, ingresa valores numéricos válidos para las coordenadas y el costo.")
      return
    }

    if (cost <= 0) {
      alert("❌ El costo de transporte debe ser mayor que cero.")
      return
    }

    this.addPoint(name, x, y, cost)
    this.clearForm()
  },

  addPointFromCanvas: function (event) {
    const rect = event.target.getBoundingClientRect()
    const canvasX = event.clientX - rect.left
    const canvasY = event.clientY - rect.top

    const coordX = Math.round(this.fromCanvasX(canvasX) * 10) / 10
    const coordY = Math.round(this.fromCanvasY(canvasY) * 10) / 10

    // Llenar el formulario con las coordenadas
    document.getElementById("xCoordinate").value = coordX
    document.getElementById("yCoordinate").value = coordY

    // Si no hay nombre, generar uno automático
    if (!document.getElementById("pointName").value.trim()) {
      document.getElementById("pointName").value = `Punto ${this.points.length + 1}`
    }

    // Si no hay costo, poner un valor por defecto
    if (!document.getElementById("transportCost").value) {
      document.getElementById("transportCost").value = "1.0"
    }
  },

  addPoint: function (name, x, y, cost) {
    // Verificar si ya existe un punto con el mismo nombre
    if (this.points.some((p) => p.name === name)) {
      alert("❌ Ya existe un punto con ese nombre. Por favor, usa un nombre diferente.")
      return
    }

    const point = { name, x, y, cost }
    this.points.push(point)

    this.updatePointsList()
    this.adjustBounds()
    this.drawCanvas()

    console.log("Punto agregado:", point)
  },

  removePoint: function (index) {
    if (confirm(`¿Estás seguro de que quieres eliminar el punto "${this.points[index].name}"?`)) {
      this.points.splice(index, 1)
      this.updatePointsList()

      if (this.points.length === 0) {
        this.centroid = null
        document.getElementById("centroidResult").innerHTML = ""
      }

      this.adjustBounds()
      this.drawCanvas()
    }
  },

  updatePointsList: function () {
    const container = document.getElementById("pointsList")
    const tbody = document.getElementById("pointsTableBody")

    if (this.points.length === 0) {
      container.style.display = "none"
      return
    }

    container.style.display = "block"
    tbody.innerHTML = ""

    this.points.forEach((point, index) => {
      const row = tbody.insertRow()
      const color = this.colors[index % this.colors.length]

      row.innerHTML = `
        <td><span style="display: inline-block; width: 12px; height: 12px; background-color: ${color}; border-radius: 50%; margin-right: 8px;"></span><strong>${point.name}</strong></td>
        <td>${point.x}</td>
        <td>${point.y}</td>
        <td>${point.cost}</td>
        <td>
          <button class="btn btn-sm btn-outline-danger" onclick="CentroideMethods.removePoint(${index})">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      `
    })
  },

  solveCentroid: function () {
    if (this.points.length < 2) {
      alert("❌ Se necesitan al menos 2 puntos para calcular el centroide.")
      return
    }

    // Calcular centroide ponderado
    let totalWeightedX = 0
    let totalWeightedY = 0
    let totalWeight = 0

    this.points.forEach((point) => {
      totalWeightedX += point.x * point.cost
      totalWeightedY += point.y * point.cost
      totalWeight += point.cost
    })

    const centroidX = totalWeightedX / totalWeight
    const centroidY = totalWeightedY / totalWeight

    this.centroid = { x: centroidX, y: centroidY }

    // Calcular costo total
    let totalCost = 0
    this.points.forEach((point) => {
      const distance = Math.sqrt(Math.pow(point.x - centroidX, 2) + Math.pow(point.y - centroidY, 2))
      totalCost += distance * point.cost
    })

    // Mostrar resultado
    document.getElementById("centroidResult").innerHTML = `
      <div class="alert alert-success">
        <h4><i class="bi bi-check-circle"></i> Centroide Calculado</h4>
        <div class="row">
          <div class="col-md-6">
            <strong>Coordenadas Óptimas:</strong><br>
            X* = ${centroidX.toFixed(3)}<br>
            Y* = ${centroidY.toFixed(3)}
          </div>
          <div class="col-md-6">
            <strong>Costo Total:</strong><br>
            ${totalCost.toFixed(3)} unidades
          </div>
        </div>
        <div class="mt-2">
          <button class="btn btn-info btn-sm" onclick="CentroideMethods.interpretarResultadosIA()">
            <i class="bi bi-robot"></i> Interpretar con IA
          </button>
        </div>
      </div>
    `

    this.drawCanvas()

    // Guardar en historial
    const Historial = window.Historial
    if (Historial) {
      const resultado = {
        success: true,
        centroide: { x: centroidX, y: centroidY },
        costo_total: totalCost,
        puntos: this.points.length,
      }
      Historial.guardarCentroide(this.points, resultado)
    }

    console.log("Centroide calculado:", this.centroid)

    // Guardar datos para análisis de sensibilidad
    CentroideMethods.ultimosPuntos = [...this.points]
    CentroideMethods.ultimoCentroide = { ...this.centroid }
    CentroideMethods.ultimoCosto = totalCost

    console.log("Datos guardados para análisis Centroide:", {
      ultimosPuntos: CentroideMethods.ultimosPuntos,
      ultimoCentroide: CentroideMethods.ultimoCentroide,
      ultimoCosto: CentroideMethods.ultimoCosto,
    })

    // Mostrar sección de análisis de sensibilidad
    document.getElementById("analisis-sensibilidad-centroide").style.display = "block"
  },

  clearForm: () => {
    document.getElementById("pointName").value = ""
    document.getElementById("xCoordinate").value = ""
    document.getElementById("yCoordinate").value = ""
    document.getElementById("transportCost").value = ""
  },

  showConfirmModal: () => {
    document.getElementById("confirmModal").style.display = "flex"
  },

  hideConfirmModal: () => {
    document.getElementById("confirmModal").style.display = "none"
  },

  resetAll: function () {
    this.points = []
    this.centroid = null
    this.minX = -10
    this.maxX = 10
    this.minY = -10
    this.maxY = 10

    this.updatePointsList()
    this.drawCanvas()
    this.clearForm()
    document.getElementById("centroidResult").innerHTML = ""
    document.getElementById("analisis-sensibilidad-centroide").style.display = "none"
    this.hideConfirmModal()
    console.log("Todo limpiado")
  },

  analizarSensibilidad: async function () {
    console.log("Verificando datos para análisis Centroide:", {
      ultimosPuntos: this.ultimosPuntos,
      ultimoCentroide: this.ultimoCentroide,
      ultimoCosto: this.ultimoCosto,
    })

    if (!this.ultimosPuntos || !this.ultimoCentroide || this.ultimosPuntos.length < 2) {
      alert("❌ Primero debes calcular el centroide antes de realizar el análisis de sensibilidad.")
      return
    }

    const porcentaje = Number.parseFloat(document.getElementById("porcentajeVariacionCentroide").value) || 10
    const tipoAnalisis = document.getElementById("tipoAnalisisCentroide").value

    // Mostrar loading
    document.getElementById("resultados-sensibilidad-centroide").innerHTML = `
      <div class="alert alert-info">
        <div class="d-flex align-items-center">
          <div class="loading me-2"></div>
          <span>Analizando sensibilidad...</span>
        </div>
      </div>
    `

    try {
      // Usar el nuevo endpoint de análisis de sensibilidad
      const response = await fetch("/api/centroide-sensitivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          puntos: this.ultimosPuntos,
          porcentaje: porcentaje,
          tipo: tipoAnalisis,
        }),
      })

      const resultado = await response.json()

      if (!response.ok) {
        throw new Error(resultado.error || "Error en el análisis")
      }

      this.mostrarResultadosSensibilidadCentroide(resultado.resultados, tipoAnalisis)
    } catch (error) {
      console.error("Error en análisis de sensibilidad Centroide:", error)
      document.getElementById("resultados-sensibilidad-centroide").innerHTML = `
        <div class="alert alert-danger">
          <h4><i class="bi bi-exclamation-triangle"></i> Error</h4>
          <p>Error en el análisis: ${error.message}</p>
        </div>
      `
    }
  },

  mostrarResultadosSensibilidadCentroide: (resultados, tipoAnalisis) => {
    const container = document.getElementById("resultados-sensibilidad-centroide")

    // Guardar resultados para interpretación IA
    CentroideMethods.ultimosResultadosSensibilidad = resultados

    let html = `<h6>Resultados del Análisis (Calculado con Python)</h6>`

    if (resultados.coordenadas && resultados.coordenadas.length > 0) {
      html += `
            <div class="mb-3">
                <strong>Sensibilidad de Coordenadas:</strong>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Punto</th>
                                <th>Coord.</th>
                                <th>Var. %</th>
                                <th>Impacto %</th>
                                <th>Sensibilidad</th>
                            </tr>
                        </thead>
                        <tbody>
        `

      resultados.coordenadas.forEach((resultado) => {
        const impactoClass =
          resultado.sensibilidad === "Alta"
            ? "text-danger"
            : resultado.sensibilidad === "Media"
              ? "text-warning"
              : "text-success"

        html += `
                <tr>
                    <td>${resultado.punto}</td>
                    <td>${resultado.coordenada}</td>
                    <td>${resultado.variacion > 0 ? "+" : ""}${resultado.variacion}%</td>
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

    if (resultados.costos && resultados.costos.length > 0) {
      html += `
            <div class="mb-3">
                <strong>Sensibilidad de Costos:</strong>
                <div class="table-responsive">
                    <table class="table table-sm">
                        <thead>
                            <tr>
                                <th>Punto</th>
                                <th>Variación</th>
                                <th>Costo Original</th>
                                <th>Costo Nuevo</th>
                                <th>Impacto %</th>
                                <th>Sensibilidad</th>
                            </tr>
                        </thead>
                        <tbody>
        `

      resultados.costos.forEach((resultado) => {
        const impactoClass =
          resultado.sensibilidad === "Alta"
            ? "text-danger"
            : resultado.sensibilidad === "Media"
              ? "text-warning"
              : "text-success"

        html += `
                <tr>
                    <td>${resultado.punto}</td>
                    <td>${resultado.variacion > 0 ? "+" : ""}${resultado.variacion}%</td>
                    <td>${resultado.costo_original.toFixed(2)}</td>
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
            <button class="btn btn-info btn-sm" onclick="CentroideMethods.interpretarSensibilidadIA()">
                <i class="bi bi-robot"></i> Interpretar con IA
            </button>
        </div>
    `

    container.innerHTML = html
  },

  // ==================== FUNCIONES DE IA ====================

  interpretarResultadosIA: async function () {
    if (!this.ultimosPuntos || !this.ultimoCentroide) {
      alert("❌ Primero debes calcular el centroide antes de interpretar los resultados.")
      return
    }

    const containerId = "interpretacion-ia-centroide"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const resultadoDiv = document.getElementById("centroidResult")
      container = document.createElement("div")
      container.id = containerId
      resultadoDiv.parentNode.insertBefore(container, resultadoDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Analizando resultados con IA...")

    const resultado = {
      centroide: this.ultimoCentroide,
      costo_total: this.ultimoCosto,
      puntos: this.ultimosPuntos.length,
    }

    const datosEntrada = {
      puntos: this.ultimosPuntos,
    }

    const interpretacion = await window.AIInterpreter.interpretarResultados("centroide", resultado, datosEntrada)
    window.AIInterpreter.mostrarInterpretacion(
      containerId,
      interpretacion,
      "🤖 Interpretación IA - Método del Centroide",
    )
  },

  interpretarSensibilidadIA: async function () {
    if (!this.ultimosPuntos || !this.ultimoCentroide) {
      alert("❌ Primero debes realizar el análisis de sensibilidad antes de interpretarlo.")
      return
    }

    const containerId = "interpretacion-sensibilidad-ia-centroide"

    // Crear contenedor si no existe
    let container = document.getElementById(containerId)
    if (!container) {
      const sensibilidadDiv = document.getElementById("resultados-sensibilidad-centroide")
      container = document.createElement("div")
      container.id = containerId
      sensibilidadDiv.parentNode.insertBefore(container, sensibilidadDiv.nextSibling)
    }

    window.AIInterpreter.mostrarLoading(containerId, "🤖 Interpretando análisis de sensibilidad...")

    const resultadosSensibilidad = this.ultimosResultadosSensibilidad || {}
    const resultadoOriginal = {
      centroide: this.ultimoCentroide,
      costo_total: this.ultimoCosto,
    }

    const interpretacion = await window.AIInterpreter.interpretarSensibilidad(
      "centroide",
      resultadosSensibilidad,
      resultadoOriginal,
    )
    window.AIInterpreter.mostrarInterpretacion(
      containerId,
      interpretacion,
      "🤖 Interpretación IA - Análisis de Sensibilidad",
    )
  },
}

// Hacer CentroideMethods disponible globalmente
window.CentroideMethods = CentroideMethods

// Inicializar cuando se carga la página
document.addEventListener("DOMContentLoaded", () => {
  console.log("Inicializando Método del Centroide...")
  CentroideMethods.init()
})
