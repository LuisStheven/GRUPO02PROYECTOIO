const AIInterpreter = {
  // Función principal para interpretar resultados
  interpretarResultados: async (metodo, resultado, datosEntrada) => {
    try {
      const response = await fetch("/api/interpret-results", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metodo: metodo,
          resultado: resultado,
          datos_entrada: datosEntrada,
        }),
      })

      const data = await response.json()

      if (data.success) {
        return data.interpretacion
      } else {
        console.error("Error en interpretación:", data.error)
        return `Error en la interpretación: ${data.error}`
      }
    } catch (error) {
      console.error("Error al interpretar resultados:", error)
      return `Error de conexión: ${error.message}`
    }
  },

  // Función para interpretar análisis de sensibilidad
  interpretarSensibilidad: async (metodo, resultadosSensibilidad, resultadoOriginal) => {
    try {
      const response = await fetch("/api/interpret-sensitivity", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metodo: metodo,
          resultados_sensibilidad: resultadosSensibilidad,
          resultado_original: resultadoOriginal,
        }),
      })

      const data = await response.json()

      if (data.success) {
        return data.interpretacion
      } else {
        console.error("Error en interpretación de sensibilidad:", data.error)
        return `Error en la interpretación: ${data.error}`
      }
    } catch (error) {
      console.error("Error al interpretar sensibilidad:", error)
      return `Error de conexión: ${error.message}`
    }
  },

  // Función para mostrar loading
  mostrarLoading: (containerId, mensaje = "🤖 Analizando con IA...") => {
    const container = document.getElementById(containerId)
    if (container) {
      container.innerHTML = `
        <div class="alert alert-info">
          <div class="d-flex align-items-center">
            <div class="spinner-border spinner-border-sm me-2" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
            <span>${mensaje}</span>
          </div>
        </div>
      `
    }
  },

  // Función para mostrar interpretación
  mostrarInterpretacion: function (containerId, interpretacion, titulo = "🤖 Interpretación IA") {
    const container = document.getElementById(containerId)
    if (container) {
      // Formatear la interpretación para mejor legibilidad
      const interpretacionFormateada = this.formatearInterpretacion(interpretacion)

      container.innerHTML = `
        <div class="card mt-3">
          <div class="card-header bg-info text-white">
            <h5 class="mb-0">${titulo}</h5>
          </div>
          <div class="card-body">
            <div class="ai-interpretation">
              ${interpretacionFormateada}
            </div>
          </div>
        </div>
      `
    }
  },

  // Función para formatear la interpretación
  formatearInterpretacion: (texto) => {
    if (!texto) return "<p>No se pudo generar la interpretación.</p>"

    // Convertir saltos de línea a párrafos
    let formateado = texto.replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>")

    // Agregar párrafos al inicio y final
    formateado = `<p>${formateado}</p>`

    // Formatear texto en negrita (palabras entre **)
    formateado = formateado.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")

    // Formatear emojis y checkmarks
    formateado = formateado.replace(/✅/g, '<span class="text-success">✅</span>')
    formateado = formateado.replace(/⚠️/g, '<span class="text-warning">⚠️</span>')
    formateado = formateado.replace(/❌/g, '<span class="text-danger">❌</span>')

    // Formatear títulos simples
    formateado = formateado.replace(/\*\*([^*]+)\*\*/g, "<strong class='text-primary'>$1</strong>")

    return formateado
  },

  // Función para agregar botón de interpretación
  agregarBotonInterpretacion: (containerId, metodo, callback) => {
    const container = document.getElementById(containerId)
    if (container) {
      // Verificar si ya existe un botón
      const botonExistente = container.querySelector(".btn-interpretar-ia")
      if (botonExistente) {
        return
      }

      const botonDiv = document.createElement("div")
      botonDiv.className = "mt-2"
      botonDiv.innerHTML = `
        <button class="btn btn-info btn-sm btn-interpretar-ia" type="button">
          <i class="bi bi-robot"></i> Interpretar con IA
        </button>
      `

      const boton = botonDiv.querySelector(".btn-interpretar-ia")
      boton.addEventListener("click", callback)

      container.appendChild(botonDiv)
    }
  },

  // Función para crear contenedor de interpretación si no existe
  crearContenedorInterpretacion: (baseContainerId, interpretacionId) => {
    let container = document.getElementById(interpretacionId)
    if (!container) {
      const baseContainer = document.getElementById(baseContainerId)
      if (baseContainer) {
        container = document.createElement("div")
        container.id = interpretacionId
        baseContainer.parentNode.insertBefore(container, baseContainer.nextSibling)
      }
    }
    return container
  },
}

// Hacer AIInterpreter disponible globalmente
window.AIInterpreter = AIInterpreter

// Estilos CSS para mejorar la presentación
const estilosIA = document.createElement("style")
estilosIA.textContent = `
  .ai-interpretation {
    font-size: 0.95rem;
    line-height: 1.6;
  }
  
  .ai-interpretation h6 {
    margin-top: 1rem;
    margin-bottom: 0.5rem;
  }
  
  .ai-interpretation p {
    margin-bottom: 0.8rem;
  }
  
  .ai-interpretation strong {
    color: #0d6efd;
  }
  
  .ai-interpretation em {
    color: #6c757d;
    font-style: italic;
  }
  
  .btn-interpretar-ia {
    transition: all 0.2s ease;
  }
  
  .btn-interpretar-ia:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  
  .spinner-border-sm {
    width: 1rem;
    height: 1rem;
  }
`

document.head.appendChild(estilosIA)
