# 💡 Plataforma de Optimización

Bienvenido a la plataforma interactiva de resolución de problemas de **Asignación**, **Localización** y **Planificación**. Esta herramienta te permite aplicar distintos modelos matemáticos efectivos para resolver problemas reales mediante una interfaz intuitiva y amigable. Fue desarrollada con Python y Flask, combinando ciencia de datos, optimización matemática y visualización web.

---

## 🚀 ¿Qué puedes hacer con esta plataforma?

Puedes seleccionar uno de los métodos matemáticos disponibles para resolver:

- Problemas de **asignación óptima** de tareas o recursos.
- Problemas de **programación lineal** con restricciones.
- Problemas de **localización estratégica** de instalaciones.
- Problemas de **planeamiento geográfico** (ubicación de puntos óptimos).

---

## 🛠️ Métodos Disponibles

### 📌 Método Húngaro
> Asigna eficientemente tareas a recursos minimizando costos o maximizando beneficios.

- Entrada: matriz de costos o beneficios.
- Salida: asignación óptima con costo total mínimo.
- Uso clásico: asignación de empleados a trabajos, máquinas a tareas, etc.

### 📊 Programación Lineal
> Encuentra el valor óptimo de una función lineal sujeta a restricciones.

- Entrada: función objetivo, restricciones lineales.
- Herramienta usada: `scipy.optimize.linprog` o `PuLP`.
- Uso clásico: maximizar utilidades, minimizar costos, planificación de producción.

### 📍 Método del Centroide
> Localiza el punto óptimo considerando el centro de gravedad de la demanda.

- Entrada: coordenadas de demanda y pesos.
- Salida: punto ideal para instalar un centro de distribución.
- Uso clásico: localización de centros logísticos o almacenes.

### 📌 P-Mediana
> Ubica estratégicamente **P** instalaciones minimizando la distancia total a los usuarios.

- Entrada: coordenadas, número de medianas `P`.
- Uso clásico: planificación de hospitales, centros educativos, etc.

---

## 📁 Estructura del Proyecto

PROYECTO-GRUPO2/
├── app.py               # Lógica principal de la aplicación Flask
├── requirements.txt     # Lista de paquetes necesarios
├── .env                 # Variables de entorno (claves y configuración)
├── templates/           # Archivos HTML para la interfaz
├── static/              # Archivos CSS, JS, imágenes, etc.
└── .git/                # Carpeta de configuración del repositorio Git

---

## 👨‍💻 Tecnologías Utilizadas
- Python 3
- Flask – Framework web ligero
- NumPy, SciPy, PuLP – Cálculo numérico y optimización
- OpenRouter AI API – Integración con modelos de lenguaje
- HTML5, CSS3, posiblemente Bootstrap para diseño

---

## 🧰 Guía de Instalación Rápida
Para instalar y ejecutar esta plataforma de optimización localmente, sigue estos pasos:

### Clona el repositorio en tu máquina local:
git clone https://github.com/LuisStheven/GRUPO02PROYECTOIO.git
cd PROYECTO-GRUPO2

### (Opcional) Crea un entorno virtual para evitar conflictos con otros proyectos:
- En Windows:
python -m venv venv
venv\Scripts\activate

- En Linux/macOS:
python3 -m venv venv
source venv/bin/activate

### Instala las dependencias necesarias:
pip install -r requirements.txt

### Ejecuta la aplicación Flask:
python app.py

### Abre tu navegador y visita:
http://localhost:5000

---

## 👨‍🏫 Autores

Desarrollado por el **Grupo 2** del curso de Investigación Operativa.

---

## 📜 Licencia

Distribuido bajo la licencia [MIT](https://opensource.org/licenses/MIT). Puedes usar, modificar y distribuir este software con libertad, siempre que se mencione la autoría original.

---

## 🙌 ¡Gracias por visitar este repositorio!

Esperamos que esta herramienta te sea útil para comprender y aplicar técnicas de optimización matemática.  
No dudes en dejar tus comentarios o contribuir con mejoras. 🚀
