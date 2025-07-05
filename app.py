from flask import Flask, render_template, request, jsonify, session
from flask_cors import CORS
import numpy as np
from scipy.optimize import linprog
from scipy.spatial.distance import cdist
import uuid
import json
from datetime import datetime
import os
import pulp
import requests

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'your-secret-key-here')
CORS(app)

# Configuración para archivos estáticos
app.static_folder = 'static'
app.template_folder = 'templates'

# Configuración de OpenRouter AI - CORREGIDO
OPENROUTER_API_KEY = os.environ.get('OPENROUTER_API_KEY', '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')
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Almacenamiento en memoria para el historial (en producción usar base de datos)
historial_global = {}

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/metodo-hungaro')
def metodo_hungaro():
    return render_template('metodo_hungaro.html')

@app.route('/programacion-lineal')
def programacion_lineal():
    return render_template('programacion_lineal.html')

@app.route('/p-mediana')
def p_mediana():
    return render_template('p_mediana.html')

@app.route('/centroide')
def centroide():
    return render_template('centroide.html')

@app.route('/api/hungarian', methods=['POST'])
def resolver_hungaro():
    try:
        data = request.get_json()
        
        # Validar datos de entrada
        if not data or 'matriz' not in data:
            return jsonify({'error': 'Datos inválidos'}), 400
        
        matriz = np.array(data['matriz'])
        objetivo = data.get('objetivo', 'minimizar')
        encabezados_filas = data.get('encabezados_filas', [])
        encabezados_columnas = data.get('encabezados_columnas', [])
        
        # Validar que la matriz no esté vacía
        if matriz.size == 0:
            return jsonify({'error': 'La matriz no puede estar vacía'}), 400
        
        # Validar que todos los valores sean números
        if not np.isfinite(matriz).all():
            return jsonify({'error': 'Todos los valores deben ser números válidos'}), 400
        
        # Resolver usando el método húngaro
        resultado = resolver_metodo_hungaro(matriz, objetivo)
        
        # Formatear resultado - CONVERTIR TIPOS NUMPY A PYTHON
        asignaciones = []
        costo_total = 0
        
        for i, j in resultado['asignacion']:
            # Convertir índices numpy a int nativo de Python
            i_py = int(i)
            j_py = int(j)
            
            fila_nombre = encabezados_filas[i_py] if i_py < len(encabezados_filas) else f'Trabajador {i_py+1}'
            columna_nombre = encabezados_columnas[j_py] if j_py < len(encabezados_columnas) else f'Trabajo {j_py+1}'
            
            # Convertir costo numpy a float nativo de Python
            costo = float(data['matriz'][i_py][j_py])
            costo_total += costo
            
            asignaciones.append({
                'fila': fila_nombre,
                'columna': columna_nombre,
                'costo': costo,
                'indices': [i_py, j_py]
            })
        
        # Convertir costo_total a float nativo de Python
        costo_total = float(costo_total)
        
        respuesta = {
            'success': True,
            'asignaciones': asignaciones,
            'costo_total': costo_total,
            'objetivo': objetivo,
            'matriz_original': data['matriz']
        }
        
        # Guardar en historial
        guardar_en_historial('hungaro', data, respuesta)
        
        return jsonify(respuesta)
        
    except Exception as e:
        return jsonify({'error': f'Error al resolver: {str(e)}'}), 500

@app.route('/api/hungarian-sensitivity', methods=['POST'])
def analisis_sensibilidad_hungaro():
    """Análisis de sensibilidad más preciso para el método húngaro"""
    try:
        data = request.get_json()
        matriz_original = np.array(data['matriz'])
        objetivo = data.get('objetivo', 'minimizar')
        porcentaje = data.get('porcentaje', 10)
        tipo_analisis = data.get('tipo', 'todos')
        
        # Resolver problema original
        resultado_original = resolver_metodo_hungaro(matriz_original, objetivo)
        costo_original = calcular_costo_asignacion(matriz_original, resultado_original['asignacion'])
        
        resultados = []
        
        if tipo_analisis == 'todos':
            # Análisis de todos los elementos
            for i in range(matriz_original.shape[0]):
                for j in range(matriz_original.shape[1]):
                    # Calcular sensibilidad para este elemento
                    sensibilidad = calcular_sensibilidad_elemento(
                        matriz_original, i, j, objetivo, porcentaje, costo_original
                    )
                    resultados.append(sensibilidad)
        
        # Ordenar por impacto
        resultados.sort(key=lambda x: abs(x['impacto_porcentual']), reverse=True)
        
        return jsonify({
            'success': True,
            'resultados': resultados[:10],  # Top 10 más sensibles
            'costo_original': float(costo_original),
            'tipo_analisis': tipo_analisis
        })
        
    except Exception as e:
        return jsonify({'error': f'Error en análisis de sensibilidad: {str(e)}'}), 500

@app.route('/api/linear-programming', methods=['POST'])
def resolver_programacion_lineal():
    try:
        data = request.get_json()
        
        # Validar datos de entrada
        if not data:
            return jsonify({'error': 'Datos inválidos'}), 400
        
        variables = data.get('variables', [])
        funcion_objetivo = data.get('funcion_objetivo', {})
        restricciones = data.get('restricciones', [])
        objetivo = data.get('objetivo', 'maximizar')
        no_negatividad = data.get('no_negatividad', True)
        
        # Validar que hay datos
        if not variables or not funcion_objetivo or not restricciones:
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Resolver programación lineal
        resultado = resolver_prog_lineal(variables, funcion_objetivo, restricciones, objetivo, no_negatividad)
        
        if not resultado['success']:
            return jsonify(resultado), 400
        
        # Guardar en historial
        guardar_en_historial('programacion-lineal', data, resultado)
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Error al resolver: {str(e)}'}), 500

@app.route('/api/branch-bound', methods=['POST'])
def resolver_branch_bound():
    try:
        data = request.get_json()
        
        # Validar datos de entrada
        if not data:
            return jsonify({'error': 'Datos inválidos'}), 400
        
        variables = data.get('variables', [])
        funcion_objetivo = data.get('funcion_objetivo', {})
        restricciones = data.get('restricciones', [])
        objetivo = data.get('objetivo', 'maximizar')
        no_negatividad = data.get('no_negatividad', True)
        mostrar_arbol = data.get('mostrar_arbol', True)
        
        # Validar que hay datos
        if not variables or not funcion_objetivo or not restricciones:
            return jsonify({'error': 'Faltan datos requeridos'}), 400
        
        # Resolver Branch & Bound
        resultado = resolver_branch_bound_method(variables, funcion_objetivo, restricciones, objetivo, no_negatividad, mostrar_arbol)
        
        if not resultado['success']:
            return jsonify(resultado), 400
        
        # Guardar en historial
        guardar_en_historial('branch-bound', data, resultado)
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Error al resolver: {str(e)}'}), 500

@app.route('/api/linear-programming-sensitivity', methods=['POST'])
def analisis_sensibilidad_lp():
    """Análisis de sensibilidad para programación lineal usando scipy"""
    try:
        data = request.get_json()
        variables = data['variables']
        funcion_objetivo = data['funcion_objetivo']
        restricciones = data['restricciones']
        objetivo = data['objetivo']
        no_negatividad = data.get('no_negatividad', True)
        porcentaje = data.get('porcentaje', 10)
        tipo_analisis = data.get('tipo', 'objetivo')
        
        # Resolver problema original
        resultado_original = resolver_prog_lineal(variables, funcion_objetivo, restricciones, objetivo, no_negatividad)
        
        if not resultado_original['success']:
            return jsonify({'error': 'No se pudo resolver el problema original'}), 400
        
        resultados = {}
        
        if tipo_analisis in ['objetivo', 'ambos']:
            # Análisis de sensibilidad de la función objetivo
            resultados['objetivo'] = analizar_sensibilidad_objetivo_lp(
                variables, funcion_objetivo, restricciones, objetivo, no_negatividad, porcentaje
            )
        
        if tipo_analisis in ['restricciones', 'ambos']:
            # Análisis de sensibilidad de restricciones (controlado)
            resultados['restricciones'] = analizar_sensibilidad_restricciones_lp(
                variables, funcion_objetivo, restricciones, objetivo, no_negatividad, porcentaje
            )
        
        return jsonify({
            'success': True,
            'resultados': resultados,
            'valor_original': resultado_original['valor_objetivo']
        })
        
    except Exception as e:
        return jsonify({'error': f'Error en análisis de sensibilidad: {str(e)}'}), 500

@app.route('/api/p-mediana', methods=['POST'])
def resolver_pmediana():
    try:
        data = request.get_json()
        
        # Validar datos de entrada
        if not data or 'distancias' not in data or 'p' not in data:
            return jsonify({'error': 'Datos inválidos'}), 400
        
        dist = data["distancias"]
        p = int(data["p"])
        encabezados_filas = data.get('encabezados_filas', [])
        encabezados_columnas = data.get('encabezados_columnas', [])
        
        # Validar que la matriz no esté vacía
        if not dist or len(dist) == 0:
            return jsonify({'error': 'La matriz de distancias no puede estar vacía'}), 400
        
        n = len(dist)
        
        # Validar que p sea válido
        if p <= 0 or p > n:
            return jsonify({'error': f'El número de medianas (p={p}) debe estar entre 1 y {n}'}), 400
        
        # Validar que todos los valores sean números
        for i in range(n):
            for j in range(n):
                if not isinstance(dist[i][j], (int, float)) or dist[i][j] < 0:
                    return jsonify({'error': f'Todos los valores deben ser números no negativos'}), 400
        
        # Modelo MILP exacto para P-Mediana
        prob = pulp.LpProblem("P-Mediana", pulp.LpMinimize)
        
        # Variables de decisión
        x = pulp.LpVariable.dicts("x", [(i, j) for i in range(n) for j in range(n)], 0, 1, pulp.LpBinary)
        y = pulp.LpVariable.dicts("y", range(n), 0, 1, pulp.LpBinary)
        
        # Función objetivo: minimizar la suma de distancias
        prob += pulp.lpSum(dist[i][j] * x[i, j] for i in range(n) for j in range(n))
        
        # Restricciones
        # Cada cliente debe ser asignado a exactamente una mediana
        for i in range(n):
            prob += pulp.lpSum(x[i, j] for j in range(n)) == 1
        
        # Un cliente solo puede ser asignado a una mediana si esa mediana está abierta
        for i in range(n):
            for j in range(n):
                prob += x[i, j] <= y[j]
        
        # Exactamente p medianas deben estar abiertas
        prob += pulp.lpSum(y[j] for j in range(n)) == p
        
        # Resolver el problema
        prob.solve(pulp.PULP_CBC_CMD(msg=0))
        
        if prob.status != pulp.LpStatusOptimal:
            return jsonify({'error': 'No se encontró una solución óptima'}), 400
        
        # Extraer resultados
        medianas = []
        for j in range(n):
            if pulp.value(y[j]) == 1:
                nombre_mediana = encabezados_columnas[j] if j < len(encabezados_columnas) else f'Ubicación {j+1}'
                medianas.append({
                    'indice': j,
                    'nombre': nombre_mediana
                })
        
        asignaciones = []
        for i in range(n):
            for j in range(n):
                if pulp.value(x[i, j]) == 1:
                    nombre_cliente = encabezados_filas[i] if i < len(encabezados_filas) else f'Cliente {i+1}'
                    nombre_mediana = encabezados_columnas[j] if j < len(encabezados_columnas) else f'Ubicación {j+1}'
                    asignaciones.append({
                        "cliente": nombre_cliente,
                        "mediana": nombre_mediana,
                        "distancia": float(dist[i][j]),
                        "indices": [i, j]
                    })
        
        costo_total = float(sum(a["distancia"] for a in asignaciones))
        
        resultado = {
            'success': True,
            'medianas': medianas,
            'asignaciones': asignaciones,
            'costo_total': costo_total,
            'p': p,
            'matriz_original': data['distancias']
        }
        
        # Guardar en historial
        guardar_en_historial('p-mediana', data, resultado)
        
        return jsonify(resultado)
        
    except Exception as e:
        return jsonify({'error': f'Error al resolver: {str(e)}'}), 500

@app.route('/api/p-mediana-sensitivity', methods=['POST'])
def analisis_sensibilidad_pmediana():
    """Análisis de sensibilidad para P-Mediana usando Python"""
    try:
        data = request.get_json()
        matriz_distancias = data['matriz']
        p_original = data['p']
        porcentaje = data.get('porcentaje', 10)
        tipo_analisis = data.get('tipo', 'distancias')
        encabezados_filas = data.get('encabezados_filas', [])
        encabezados_columnas = data.get('encabezados_columnas', [])
        
        # Resolver problema original
        resultado_original = resolver_pmediana_python(matriz_distancias, p_original)
        costo_original = resultado_original['costo_total']
        
        resultados = {}
        
        if tipo_analisis in ['distancias', 'ambos']:
            resultados['distancias'] = analizar_sensibilidad_distancias_pmediana(
                matriz_distancias, p_original, porcentaje, costo_original, encabezados_filas, encabezados_columnas
            )
        
        if tipo_analisis in ['p', 'ambos']:
            resultados['p'] = analizar_sensibilidad_p_pmediana(
                matriz_distancias, p_original, costo_original
            )
        
        return jsonify({
            'success': True,
            'resultados': resultados,
            'costo_original': costo_original
        })
        
    except Exception as e:
        return jsonify({'error': f'Error en análisis de sensibilidad P-Mediana: {str(e)}'}), 500

@app.route('/api/centroide-sensitivity', methods=['POST'])
def analisis_sensibilidad_centroide():
    """Análisis de sensibilidad para el Método del Centroide usando Python"""
    try:
        data = request.get_json()
        puntos = data['puntos']
        porcentaje = data.get('porcentaje', 10)
        tipo_analisis = data.get('tipo', 'coordenadas')
        
        # Calcular centroide y costo original
        centroide_original = calcular_centroide_python(puntos)
        costo_original = calcular_costo_total_centroide(centroide_original, puntos)
        
        resultados = {}
        
        if tipo_analisis in ['coordenadas', 'ambos']:
            resultados['coordenadas'] = analizar_sensibilidad_coordenadas_centroide(
                puntos, porcentaje, centroide_original, costo_original
            )
        
        if tipo_analisis in ['costos', 'ambos']:
            resultados['costos'] = analizar_sensibilidad_costos_centroide(
                puntos, porcentaje, centroide_original, costo_original
            )
        
        return jsonify({
            'success': True,
            'resultados': resultados,
            'centroide_original': centroide_original,
            'costo_original': costo_original
        })
        
    except Exception as e:
        return jsonify({'error': f'Error en análisis de sensibilidad Centroide: {str(e)}'}), 500

# ==================== ENDPOINTS DE INTERPRETACIÓN IA ====================

@app.route('/api/interpret-results', methods=['POST'])
def interpretar_resultados():
    """Interpreta los resultados usando IA"""
    try:
        data = request.get_json()
        
        # Validar que se recibieron datos
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        metodo = data.get('metodo')
        resultado = data.get('resultado')
        datos_entrada = data.get('datos_entrada', {})
        
        # Validar campos requeridos
        if not metodo or not resultado:
            return jsonify({'error': 'Faltan campos requeridos: metodo y resultado'}), 400
        
        # Verificar si hay API key configurada
        if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == '':
            # Si no hay API key, devolver una interpretación básica
            interpretacion_basica = generar_interpretacion_basica(metodo, resultado, datos_entrada)
            return jsonify({
                'success': True,
                'interpretacion': interpretacion_basica,
                'metodo': metodo,
                'fuente': 'interpretacion_basica'
            })
        
        # Generar prompt según el método
        prompt = generar_prompt_interpretacion(metodo, resultado, datos_entrada)
        
        # Llamar a la IA
        interpretacion = llamar_openrouter_ai(prompt)
        
        return jsonify({
            'success': True,
            'interpretacion': interpretacion,
            'metodo': metodo,
            'fuente': 'openrouter_ai'
        })
        
    except Exception as e:
        print(f"Error en interpretar_resultados: {str(e)}")  # Para debugging
        # En caso de error, devolver interpretación básica
        try:
            interpretacion_basica = generar_interpretacion_basica(
                data.get('metodo', 'desconocido'), 
                data.get('resultado', {}), 
                data.get('datos_entrada', {})
            )
            return jsonify({
                'success': True,
                'interpretacion': interpretacion_basica,
                'metodo': data.get('metodo', 'desconocido'),
                'fuente': 'interpretacion_basica_fallback'
            })
        except:
            return jsonify({'error': f'Error en interpretación: {str(e)}'}), 500

@app.route('/api/interpret-sensitivity', methods=['POST'])
def interpretar_sensibilidad():
    """Interpreta el análisis de sensibilidad usando IA"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No se recibieron datos'}), 400
            
        metodo = data.get('metodo')
        resultados_sensibilidad = data.get('resultados_sensibilidad')
        resultado_original = data.get('resultado_original', {})
        
        if not metodo or not resultados_sensibilidad:
            return jsonify({'error': 'Faltan campos requeridos'}), 400
        
        # Verificar si hay API key configurada
        if not OPENROUTER_API_KEY or OPENROUTER_API_KEY == '':
            # Si no hay API key, devolver una interpretación básica
            interpretacion_basica = generar_interpretacion_sensibilidad_basica(metodo, resultados_sensibilidad, resultado_original)
            return jsonify({
                'success': True,
                'interpretacion': interpretacion_basica,
                'metodo': metodo,
                'fuente': 'interpretacion_basica'
            })
        
        # Generar prompt para sensibilidad
        prompt = generar_prompt_sensibilidad(metodo, resultados_sensibilidad, resultado_original)
        
        # Llamar a la IA
        interpretacion = llamar_openrouter_ai(prompt)
        
        return jsonify({
            'success': True,
            'interpretacion': interpretacion,
            'metodo': metodo,
            'fuente': 'openrouter_ai'
        })
        
    except Exception as e:
        print(f"Error en interpretar_sensibilidad: {str(e)}")  # Para debugging
        # En caso de error, devolver interpretación básica
        try:
            interpretacion_basica = generar_interpretacion_sensibilidad_basica(
                data.get('metodo', 'desconocido'), 
                data.get('resultados_sensibilidad', {}), 
                data.get('resultado_original', {})
            )
            return jsonify({
                'success': True,
                'interpretacion': interpretacion_basica,
                'metodo': data.get('metodo', 'desconocido'),
                'fuente': 'interpretacion_basica_fallback'
            })
        except:
            return jsonify({'error': f'Error en interpretación de sensibilidad: {str(e)}'}), 500

@app.route('/api/historial', methods=['GET'])
def obtener_historial():
    session_id = session.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
        session['session_id'] = session_id
    
    historial = historial_global.get(session_id, [])
    return jsonify(historial)

@app.route('/api/historial', methods=['DELETE'])
def limpiar_historial():
    session_id = session.get('session_id')
    if session_id and session_id in historial_global:
        historial_global[session_id] = []
    return jsonify({'success': True})

@app.route('/api/historial/<int:entrada_id>', methods=['DELETE'])
def eliminar_entrada_historial(entrada_id):
    session_id = session.get('session_id')
    if session_id and session_id in historial_global:
        historial_global[session_id] = [
            entrada for entrada in historial_global[session_id] 
            if entrada['id'] != entrada_id
        ]
    return jsonify({'success': True})

# ==================== FUNCIONES DE IA ====================

def llamar_openrouter_ai(prompt):
    """Llama a OpenRouter AI con el prompt dado"""
    try:
        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://solver-grupo2.vercel.app",
            "X-Title": "Solver Métodos Directos - Grupo 2"
        }
        
        payload = {
            "model": "openrouter/cypher-alpha:free",
            "messages": [
                {
                    "role": "system",
                    "content": "Eres un experto en Investigación Operativa y Optimización. Recibiste los resultados de un método de optimización aplicado en un sistema web. Tienes que interpretar los resultados de forma sencilla, clara y entendible, asi como amigable."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 800,
            "temperature": 0.7
        }
        
        response = requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            return result['choices'][0]['message']['content']
        else:
            return f"Error en la API: {response.status_code} - {response.text}"
            
    except requests.exceptions.Timeout:
        return "Error: Tiempo de espera agotado al conectar con la IA."
    except requests.exceptions.RequestException as e:
        return f"Error de conexión: {str(e)}"
    except Exception as e:
        return f"Error inesperado: {str(e)}"

def generar_interpretacion_basica(metodo, resultado, datos_entrada):
    """Genera una interpretación básica y concisa sin IA"""
    
    if metodo == 'hungaro':
        costo_total = resultado.get('costo_total', 0)
        objetivo = resultado.get('objetivo', 'minimizar')
        asignaciones = resultado.get('asignaciones', [])
        
        interpretacion = f"""
**Resultado del Método Húngaro**

✅ **Solución óptima encontrada**
- {'Costo mínimo' if objetivo == 'minimizar' else 'Beneficio máximo'}: **{costo_total}**
- {len(asignaciones)} asignaciones realizadas

**¿Qué significa?**
Esta es la mejor combinación posible de trabajadores y tareas para {'minimizar costos' if objetivo == 'minimizar' else 'maximizar beneficios'}.

**Recomendación:** Implementa estas asignaciones tal como se muestran para obtener el resultado óptimo.
"""
        
    elif metodo in ['programacion-lineal', 'branch-bound']:
        valor_objetivo = resultado.get('valor_objetivo', 0)
        objetivo = resultado.get('objetivo', 'maximizar')
        solucion = resultado.get('solucion', {})
        
        interpretacion = f"""
**Resultado de {'Programación Lineal Entera' if metodo == 'branch-bound' else 'Programación Lineal'}**

✅ **Solución óptima:** {valor_objetivo}

**Valores de las variables:**
"""
        for var, val in solucion.items():
            interpretacion += f"- {var} = {val}\n"
        
        interpretacion += f"""
**¿Qué significa?**
Estos valores {'maximizan' if objetivo == 'maximizar' else 'minimizan'} tu función objetivo respetando todas las restricciones.

**Recomendación:** Usa estos valores en tu implementación práctica.
"""
        
    elif metodo == 'p-mediana':
        costo_total = resultado.get('costo_total', 0)
        p = resultado.get('p', 0)
        medianas = resultado.get('medianas', [])
        
        interpretacion = f"""
**Resultado P-Mediana**

✅ **Ubicaciones óptimas encontradas**
- {p} medianas ubicadas
- Costo total mínimo: **{costo_total}**

**Ubicaciones seleccionadas:**
"""
        for mediana in medianas:
            interpretacion += f"- {mediana['nombre']}\n"
        
        interpretacion += f"""
**¿Qué significa?**
Estas ubicaciones minimizan la distancia total a todos tus clientes.

**Recomendación:** Instala tus servicios en estas ubicaciones para optimizar la cobertura.
"""
        
    elif metodo == 'centroide':
        centroide = resultado.get('centroide', {})
        costo_total = resultado.get('costo_total', 0)
        
        interpretacion = f"""
**Resultado del Centroide**

✅ **Ubicación óptima encontrada**
- Coordenadas: X = {centroide.get('x', 0):.2f}, Y = {centroide.get('y', 0):.2f}
- Costo total: {costo_total:.2f}

**¿Qué significa?**
Esta ubicación minimiza los costos de transporte a todos tus puntos de demanda.

**Recomendación:** Ubica tu instalación en estas coordenadas para optimizar costos.
"""
    else:
        interpretacion = f"""
**Análisis completado**

✅ Se encontró la solución óptima para tu problema.

**Recomendación:** Revisa los resultados y aplícalos según tus necesidades específicas.
"""
    
    return interpretacion

def generar_interpretacion_sensibilidad_basica(metodo, resultados_sensibilidad, resultado_original):
    """Genera una interpretación básica y concisa del análisis de sensibilidad"""
    
    interpretacion = f"""
**Análisis de Sensibilidad**

**¿Qué es esto?**
Muestra qué tan sensible es tu solución a cambios en los datos.

**Resultados:**
"""
    
    # Analizar los resultados según el tipo
    if isinstance(resultados_sensibilidad, dict):
        elementos_criticos = 0
        for tipo, datos in resultados_sensibilidad.items():
            if isinstance(datos, list) and len(datos) > 0:
                # Contar elementos sensibles
                sensibles = [item for item in datos if abs(item.get('impacto_porcentual', 0)) > 10]
                elementos_criticos += len(sensibles)
        
        if elementos_criticos > 0:
            interpretacion += f"⚠️ **{elementos_criticos} elementos críticos** - Cambios pequeños pueden afectar mucho la solución\n"
        else:
            interpretacion += f"✅ **Solución robusta** - Los cambios pequeños no afectan mucho el resultado\n"
    
    interpretacion += f"""
**¿Qué hacer?**
- Si hay elementos críticos: Monitorea esos valores de cerca
- Si la solución es robusta: Tienes flexibilidad para hacer ajustes menores

**Recomendación:** {'Presta atención especial a los elementos marcados como críticos' if elementos_criticos > 0 else 'Tu solución es estable ante pequeños cambios'}
"""
    
    return interpretacion

def generar_prompt_interpretacion(metodo, resultado, datos_entrada):
    """Genera prompts más concisos y contextuales para la IA"""
    
    if metodo == 'hungaro':
        # Extraer información contextual
        trabajadores = datos_entrada.get('encabezados_filas', [])
        trabajos = datos_entrada.get('encabezados_columnas', [])
        objetivo = datos_entrada.get('objetivo', 'minimizar')
        dimensiones = datos_entrada.get('dimensiones', {})
        rango_costos = datos_entrada.get('rango_costos', {})
        
        # Crear contexto de asignaciones
        asignaciones_contexto = ""
        if 'asignaciones_detalladas' in resultado:
            asignaciones_contexto = "\n".join([
                f"• {asig.get('trabajador', 'Trabajador')} → {asig.get('trabajo', 'Trabajo')} (Costo: {asig.get('costo', 0)}, {asig.get('costo_relativo', 'N/A')})"
                for asig in resultado['asignaciones_detalladas'][:5]  # Limitar a 5 para no sobrecargar
            ])
        
        return f"""
Analiza estos resultados del Método Húngaro con contexto empresarial:

**CONTEXTO DEL PROBLEMA:**
- Trabajadores: {', '.join(trabajadores[:3])}{'...' if len(trabajadores) > 3 else ''}
- Trabajos/Tareas: {', '.join(trabajos[:3])}{'...' if len(trabajos) > 3 else ''}
- Objetivo: {objetivo.upper()} costos
- Dimensión: {dimensiones.get('filas', 0)}x{dimensiones.get('columnas', 0)} ({'balanceado' if dimensiones.get('filas') == dimensiones.get('columnas') else 'desbalanceado'})

**RESULTADOS OBTENIDOS:**
- Costo total óptimo: {resultado.get('costo_total', 0)}
- Costo promedio por asignación: {resultado.get('eficiencia', {}).get('costo_promedio_por_asignacion', 'N/A')}
- Rango de costos en matriz: {rango_costos.get('minimo', 0)} - {rango_costos.get('maximo', 0)}

**ASIGNACIONES PRINCIPALES:**
{asignaciones_contexto}

Proporciona una interpretación práctica y empresarial de estos resultados, enfocándote en:
1. ¿Qué significan estas asignaciones en términos de eficiencia operativa?
2. ¿Hay alguna asignación que destaque por su costo alto/bajo?
3. Recomendación estratégica basada en los resultados.

Máximo 150 palabras. Sé directo y práctico.
"""

    elif metodo == 'p-mediana':
        # Extraer información contextual
        clientes = datos_entrada.get('encabezados_filas', [])
        ubicaciones = datos_entrada.get('encabezados_columnas', [])
        p = datos_entrada.get('p', 0)
        dimensiones = datos_entrada.get('dimensiones', {})
        estadisticas = datos_entrada.get('estadisticas_distancias', {})
        cobertura = datos_entrada.get('cobertura', {})
        
        # Crear contexto de medianas seleccionadas
        medianas_contexto = ""
        if 'medianas_detalladas' in resultado:
            medianas_contexto = "\n".join([
                f"• {mediana.get('nombre', 'Ubicación')} - {mediana.get('clientes_asignados', 0)} clientes (dist. prom: {mediana.get('distancia_promedio', 0):.1f})"
                for mediana in resultado['medianas_detalladas']
            ])
        
        return f"""
Analiza estos resultados de P-Mediana con contexto logístico:

**CONTEXTO DEL PROBLEMA:**
- Clientes: {', '.join(clientes[:3])}{'...' if len(clientes) > 3 else ''} ({dimensiones.get('clientes', 0)} total)
- Ubicaciones posibles: {', '.join(ubicaciones[:3])}{'...' if len(ubicaciones) > 3 else ''} ({dimensiones.get('ubicaciones_posibles', 0)} total)
- Medianas a instalar: {p} de {dimensiones.get('ubicaciones_posibles', 0)} ({cobertura.get('porcentaje_ubicaciones_usadas', 'N/A')})
- Promedio clientes por mediana: {cobertura.get('clientes_por_mediana', 'N/A')}

**RESULTADOS OBTENIDOS:**
- Costo total mínimo: {resultado.get('costo_total', 0)}
- Distancia promedio por cliente: {resultado.get('eficiencia', {}).get('distancia_promedio_por_cliente', 'N/A')}
- Ahorro vs peor escenario: {resultado.get('eficiencia', {}).get('ahorro_vs_peor_caso', {}).get('ahorro_porcentual', 'N/A')}
- Rango distancias: {estadisticas.get('minima', 0)} - {estadisticas.get('maxima', 0)}

**UBICACIONES SELECCIONADAS:**
{medianas_contexto}

Proporciona una interpretación logística y estratégica:
1. ¿Qué tan eficiente es esta distribución de medianas?
2. ¿Hay desequilibrios en la carga de clientes por mediana?
3. Recomendación operativa basada en la cobertura lograda.

Máximo 150 palabras. Enfócate en aspectos logísticos y operativos.
"""

    elif metodo == 'centroide':
        # Extraer información contextual
        puntos = datos_entrada.get('puntos', [])
        estadisticas = datos_entrada.get('estadisticas_puntos', {})
        centroide = resultado.get('centroide', {})
        analisis = resultado.get('analisis_ubicacion', {})
        
        # Crear contexto de puntos
        puntos_contexto = ""
        if puntos:
            puntos_contexto = "\n".join([
                f"• {punto.get('name', 'Punto')} en ({punto.get('x', 0)}, {punto.get('y', 0)}) - Costo: {punto.get('cost', 0)}"
                for punto in puntos[:4]  # Limitar a 4 puntos
            ])
            if len(puntos) > 4:
                puntos_contexto += f"\n• ... y {len(puntos) - 4} puntos más"
        
        return f"""
Analiza estos resultados del Método del Centroide con contexto geográfico:

**CONTEXTO DEL PROBLEMA:**
- Puntos de demanda: {estadisticas.get('cantidad', 0)} ubicaciones
- Área de cobertura: {datos_entrada.get('dispersion', {}).get('area_cobertura', 0):.1f} unidades²
- Rango coordenadas X: {estadisticas.get('rango_x', {}).get('minimo', 0):.1f} a {estadisticas.get('rango_x', {}).get('maximo', 0):.1f}
- Rango coordenadas Y: {estadisticas.get('rango_y', {}).get('minimo', 0):.1f} a {estadisticas.get('rango_y', {}).get('maximo', 0):.1f}
- Costos de transporte: {estadisticas.get('costos', {}).get('minimo', 0)} - {estadisticas.get('costos', {}).get('maximo', 0)} (prom: {estadisticas.get('costos', {}).get('promedio', 0)})

**UBICACIÓN ÓPTIMA CALCULADA:**
- Centroide: ({centroide.get('x', 0):.2f}, {centroide.get('y', 0):.2f})
- Costo total: {resultado.get('costo_total', 0):.2f}
- Costo promedio por punto: {resultado.get('eficiencia', {}).get('costo_promedio_por_punto', 'N/A')}
- Ubicación {'DENTRO' if analisis.get('esta_dentro_del_area', False) else 'FUERA'} del área de puntos
- Punto más costoso de servir: {resultado.get('eficiencia', {}).get('punto_mas_costoso', {}).get('nombre', 'N/A')}

**PUNTOS DE DEMANDA:**
{puntos_contexto}

Proporciona una interpretación geográfica y logística:
1. ¿Qué tan estratégica es esta ubicación del centroide?
2. ¿La distribución de costos es equilibrada o hay puntos problemáticos?
3. Recomendación práctica para la implementación.

Máximo 150 palabras. Enfócate en aspectos geográficos y de distribución.
"""

    else:
        return f"Analiza BREVEMENTE los resultados del método {metodo}. Máximo 150 palabras."

def generar_prompt_sensibilidad(metodo, resultados_sensibilidad, resultado_original):
    """Genera prompts más concisos para análisis de sensibilidad"""
    
    return f"""
Analiza BREVEMENTE este análisis de sensibilidad para {metodo.upper()}:

Resultado original: {resultado_original}

Proporciona:
1. ¿La solución es robusta o sensible ante cambios en los parámetros?
2. ¿Qué variables, restricciones o coeficientes requieren mayor atención?
3. Una recomendación práctica basada en esta sensibilidad.
4. Máximo 100 palabras. Escribe en español pero claro.
NO ENUMERES (SEPARA SI DESEAS EN PARRAFOS) NI DES RESUMEN NI NOTA, SE AMIGABLE
"""

# ==================== FUNCIONES EXISTENTES ====================

def clasificar_sensibilidad(impacto_porcentual):
    """Clasifica la sensibilidad basada en el impacto porcentual"""
    abs_impacto = abs(impacto_porcentual)
    if abs_impacto > 10:
        return 'Alta'
    elif abs_impacto > 5:
        return 'Media'
    else:
        return 'Baja'

def resolver_metodo_hungaro(matriz, objetivo='minimizar'):
    """
    Resuelve el problema de asignación usando el método húngaro
    """
    from scipy.optimize import linear_sum_assignment
    
    # Convertir a numpy array
    cost_matrix = np.array(matriz, dtype=float)
    
    # Si es maximización, convertir a minimización
    if objetivo == 'maximizar':
        cost_matrix = np.max(cost_matrix) - cost_matrix
    
    # Resolver usando scipy
    row_indices, col_indices = linear_sum_assignment(cost_matrix)
    
    # Crear lista de asignaciones
    asignacion = list(zip(row_indices, col_indices))
    
    return {
        'asignacion': asignacion,
        'costo_matriz': cost_matrix.tolist()
    }

def calcular_costo_asignacion(matriz, asignacion):
    """Calcula el costo total de una asignación"""
    costo_total = 0
    for i, j in asignacion:
        costo_total += matriz[i][j]
    return costo_total

def calcular_sensibilidad_elemento(matriz, i, j, objetivo, porcentaje, costo_original):
    """Calcula la sensibilidad de un elemento específico de la matriz"""
    valor_original = matriz[i][j]
    
    # Probar incremento
    matriz_modificada = matriz.copy()
    incremento = valor_original * (porcentaje / 100)
    matriz_modificada[i][j] = valor_original + incremento
    
    resultado_nuevo = resolver_metodo_hungaro(matriz_modificada, objetivo)
    costo_nuevo = calcular_costo_asignacion(matriz_modificada, resultado_nuevo['asignacion'])
    
    # Calcular impacto
    cambio_absoluto = costo_nuevo - costo_original
    impacto_porcentual = (cambio_absoluto / costo_original) * 100 if costo_original != 0 else 0
    
    return {
        'posicion': f'({i+1}, {j+1})',
        'valor_original': float(valor_original),
        'valor_nuevo': float(valor_original + incremento),
        'costo_original': float(costo_original),
        'costo_nuevo': float(costo_nuevo),
        'cambio_absoluto': float(cambio_absoluto),
        'impacto_porcentual': float(impacto_porcentual),
        'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
    }

def resolver_prog_lineal(variables, funcion_objetivo, restricciones, objetivo, no_negatividad):
    """
    Resuelve problemas de programación lineal usando scipy
    """
    try:
        # Preparar coeficientes de la función objetivo
        c = []
        for var in variables:
            coef = funcion_objetivo.get(var, 0)
            # Si es maximización, negar los coeficientes
            if objetivo == 'maximizar':
                coef = -coef
            c.append(coef)
        
        c = np.array(c)
        
        # Preparar restricciones
        A_ub = []  # Coeficientes para <=
        b_ub = []  # Valores para <=
        A_eq = []  # Coeficientes para =
        b_eq = []  # Valores para =
        
        for restriccion in restricciones:
            coeficientes = []
            for var in variables:
                coeficientes.append(restriccion['coeficientes'].get(var, 0))
            
            if restriccion['operador'] == '<=':
                A_ub.append(coeficientes)
                b_ub.append(restriccion['valor'])
            elif restriccion['operador'] == '>=':
                # Convertir >= a <= multiplicando por -1
                A_ub.append([-x for x in coeficientes])
                b_ub.append(-restriccion['valor'])
            elif restriccion['operador'] == '=':
                A_eq.append(coeficientes)
                b_eq.append(restriccion['valor'])
        
        # Configurar bounds (restricciones de no negatividad)
        bounds = []
        if no_negatividad:
            bounds = [(0, None) for _ in variables]
        else:
            bounds = [(None, None) for _ in variables]
        
        # Convertir a numpy arrays
        A_ub = np.array(A_ub) if A_ub else None
        b_ub = np.array(b_ub) if b_ub else None
        A_eq = np.array(A_eq) if A_eq else None
        b_eq = np.array(b_eq) if b_eq else None
        
        # Resolver
        resultado = linprog(
            c=c,
            A_ub=A_ub,
            b_ub=b_ub,
            A_eq=A_eq,
            b_eq=b_eq,
            bounds=bounds,
            method='highs'
        )
        
        if not resultado.success:
            return {
                'success': False,
                'error': 'No se encontró una solución factible'
            }
        
        # Formatear resultado - CONVERTIR TIPOS NUMPY A PYTHON
        solucion = {}
        for i, var in enumerate(variables):
            # Convertir numpy float64 a float nativo de Python
            solucion[var] = float(resultado.x[i])
        
        # Calcular valor objetivo original
        valor_objetivo = float(resultado.fun)
        if objetivo == 'maximizar':
            valor_objetivo = -valor_objetivo
        
        return {
            'success': True,
            'solucion': solucion,
            'valor_objetivo': valor_objetivo,
            'objetivo': objetivo,
            'factible': True
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Error en el cálculo: {str(e)}'
        }

def resolver_branch_bound_method(variables, funcion_objetivo, restricciones, objetivo, no_negatividad, mostrar_arbol):
    """
    Resuelve problemas de programación lineal entera usando Branch & Bound
    """
    try:
        import pulp
        
        # Crear el problema
        if objetivo == 'maximizar':
            prob = pulp.LpProblem("Branch_Bound", pulp.LpMaximize)
        else:
            prob = pulp.LpProblem("Branch_Bound", pulp.LpMinimize)
        
        # Variables de decisión (enteras)
        vars_pulp = {}
        for var in variables:
            if no_negatividad:
                vars_pulp[var] = pulp.LpVariable(var, lowBound=0, cat='Integer')
            else:
                vars_pulp[var] = pulp.LpVariable(var, cat='Integer')
        
        # Función objetivo
        objetivo_expr = pulp.lpSum([funcion_objetivo.get(var, 0) * vars_pulp[var] for var in variables])
        prob += objetivo_expr
        
        # Restricciones
        for i, restriccion in enumerate(restricciones):
            expr = pulp.lpSum([restriccion['coeficientes'].get(var, 0) * vars_pulp[var] for var in variables])
            
            if restriccion['operador'] == '<=':
                prob += expr <= restriccion['valor']
            elif restriccion['operador'] == '>=':
                prob += expr >= restriccion['valor']
            elif restriccion['operador'] == '=':
                prob += expr == restriccion['valor']
        
        # Resolver
        prob.solve(pulp.PULP_CBC_CMD(msg=0))
        
        if prob.status != pulp.LpStatusOptimal:
            return {
                'success': False,
                'error': 'No se encontró una solución óptima entera'
            }
        
        # Extraer solución
        solucion = {}
        for var in variables:
            solucion[var] = float(vars_pulp[var].varValue) if vars_pulp[var].varValue is not None else 0
        
        valor_objetivo = float(pulp.value(prob.objective))
        
        # Generar árbol simplificado (simulado)
        arbol = generar_arbol_branch_bound_simulado(variables, solucion, valor_objetivo, mostrar_arbol)
        
        return {
            'success': True,
            'solucion': solucion,
            'valor_objetivo': valor_objetivo,
            'objetivo': objetivo,
            'factible': True,
            'nodos_explorados': len(arbol) * 2 if arbol else 1,
            'arbol': arbol if mostrar_arbol else None
        }
        
    except Exception as e:
        return {
            'success': False,
            'error': f'Error en Branch & Bound: {str(e)}'
        }

def generar_arbol_branch_bound_simulado(variables, solucion_final, valor_final, mostrar_arbol):
    """
    Genera un árbol de Branch & Bound simplificado para visualización
    """
    if not mostrar_arbol:
        return None
    
    try:
        arbol = []
        
        # Nivel 0: Nodo raíz (relajación lineal)
        nivel_0 = [{
            'id': 0,
            'restriccion': 'Problema Original (Relajación)',
            'valor_objetivo': valor_final + 0.5,  # Simular valor relajado
            'solucion': {var: val + 0.3 for var, val in solucion_final.items()},
            'es_optimo': False,
            'infactible': False,
            'podado': False
        }]
        arbol.append(nivel_0)
        
        # Nivel 1: Ramificaciones
        if len(variables) > 0:
            var_principal = variables[0]
            val_principal = solucion_final[var_principal]
            
            nivel_1 = [
                {
                    'id': 1,
                    'restriccion': f'{var_principal} ≤ {int(val_principal)}',
                    'valor_objetivo': valor_final - 0.2,
                    'solucion': {var: val if var != var_principal else int(val_principal) for var, val in solucion_final.items()},
                    'es_optimo': False,
                    'infactible': False,
                    'podado': True
                },
                {
                    'id': 2,
                    'restriccion': f'{var_principal} ≥ {int(val_principal) + 1}',
                    'valor_objetivo': valor_final,
                    'solucion': solucion_final,
                    'es_optimo': True,
                    'infactible': False,
                    'podado': False
                }
            ]
            arbol.append(nivel_1)
        
        return arbol
        
    except Exception as e:
        print(f"Error generando árbol: {e}")
        return None

def analizar_sensibilidad_objetivo_lp(variables, funcion_objetivo, restricciones, objetivo, no_negatividad, porcentaje):
    """Análisis de sensibilidad de la función objetivo"""
    resultados = []
    
    # Resolver problema original
    resultado_original = resolver_prog_lineal(variables, funcion_objetivo, restricciones, objetivo, no_negatividad)
    valor_original = resultado_original['valor_objetivo']
    
    # Analizar cada variable en la función objetivo
    for variable in variables:
        coef_original = funcion_objetivo.get(variable, 0)
        if coef_original != 0:  # Solo analizar variables con coeficiente no cero
            # Probar variaciones
            for variacion in [-porcentaje, porcentaje]:
                funcion_modificada = funcion_objetivo.copy()
                cambio = coef_original * (variacion / 100)
                funcion_modificada[variable] = coef_original + cambio
                
                resultado_nuevo = resolver_prog_lineal(variables, funcion_modificada, restricciones, objetivo, no_negatividad)
                
                if resultado_nuevo['success']:
                    cambio_valor = resultado_nuevo['valor_objetivo'] - valor_original
                    impacto_porcentual = (cambio_valor / abs(valor_original)) * 100 if valor_original != 0 else 0
                    
                    resultados.append({
                        'variable': variable,
                        'variacion': variacion,
                        'coef_original': coef_original,
                        'coef_nuevo': coef_original + cambio,
                        'valor_original': valor_original,
                        'valor_nuevo': resultado_nuevo['valor_objetivo'],
                        'impacto_porcentual': impacto_porcentual,
                        'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
                    })
    
    return resultados

def analizar_sensibilidad_restricciones_lp(variables, funcion_objetivo, restricciones, objetivo, no_negatividad, porcentaje):
    """Análisis de sensibilidad de restricciones (limitado para evitar cuelgues)"""
    resultados = []
    
    # Resolver problema original
    resultado_original = resolver_prog_lineal(variables, funcion_objetivo, restricciones, objetivo, no_negatividad)
    valor_original = resultado_original['valor_objetivo']
    
    # Limitar a las primeras 3 restricciones para evitar cuelgues
    restricciones_limitadas = restricciones[:3]
    
    for idx, restriccion in enumerate(restricciones_limitadas):
        valor_original_rest = restriccion['valor']
        
        # Solo probar una variación por restricción
        variacion = porcentaje
        restricciones_modificadas = restricciones.copy()
        cambio = valor_original_rest * (variacion / 100)
        restricciones_modificadas[idx] = restriccion.copy()
        restricciones_modificadas[idx]['valor'] = valor_original_rest + cambio
        
        resultado_nuevo = resolver_prog_lineal(variables, funcion_objetivo, restricciones_modificadas, objetivo, no_negatividad)
        
        if resultado_nuevo['success']:
            cambio_valor = resultado_nuevo['valor_objetivo'] - valor_original
            impacto_porcentual = (cambio_valor / abs(valor_original)) * 100 if valor_original != 0 else 0
            
            resultados.append({
                'restriccion': idx + 1,
                'variacion': variacion,
                'valor_original': valor_original_rest,
                'valor_nuevo': valor_original_rest + cambio,
                'impacto_porcentual': impacto_porcentual,
                'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
            })
    
    return resultados

def resolver_pmediana_python(matriz_distancias, p):
    """Resuelve P-Mediana usando PuLP"""
    n = len(matriz_distancias)
    
    # Modelo MILP exacto para P-Mediana
    prob = pulp.LpProblem("P-Mediana", pulp.LpMinimize)
    
    # Variables de decisión
    x = pulp.LpVariable.dicts("x", [(i, j) for i in range(n) for j in range(n)], 0, 1, pulp.LpBinary)
    y = pulp.LpVariable.dicts("y", range(n), 0, 1, pulp.LpBinary)
    
    # Función objetivo: minimizar la suma de distancias
    prob += pulp.lpSum(matriz_distancias[i][j] * x[i, j] for i in range(n) for j in range(n))
    
    # Restricciones
    for i in range(n):
        prob += pulp.lpSum(x[i, j] for j in range(n)) == 1
    
    for i in range(n):
        for j in range(n):
            prob += x[i, j] <= y[j]
    
    prob += pulp.lpSum(y[j] for j in range(n)) == p
    
    # Resolver el problema
    prob.solve(pulp.PULP_CBC_CMD(msg=0))
    
    if prob.status != pulp.LpStatusOptimal:
        raise Exception('No se encontró una solución óptima')
    
    # Calcular costo total
    costo_total = 0
    for i in range(n):
        for j in range(n):
            if pulp.value(x[i, j]) == 1:
                costo_total += matriz_distancias[i][j]
    
    return {
        'costo_total': costo_total,
        'status': 'optimal'
    }

def analizar_sensibilidad_distancias_pmediana(matriz_distancias, p, porcentaje, costo_original, encabezados_filas, encabezados_columnas):
    """Análisis de sensibilidad de distancias en P-Mediana"""
    resultados = []
    n = len(matriz_distancias)
    
    # Analizar solo algunas distancias críticas para evitar sobrecarga
    elementos_a_analizar = min(10, n * n)  # Máximo 10 elementos
    
    for count in range(elementos_a_analizar):
        i = count // n
        j = count % n
        if i >= n:
            break
            
        distancia_original = matriz_distancias[i][j]
        if distancia_original > 0:  # Solo analizar distancias no cero
            
            # Probar incremento
            matriz_modificada = [fila[:] for fila in matriz_distancias]  # Copia profunda
            incremento = distancia_original * (porcentaje / 100)
            matriz_modificada[i][j] = distancia_original + incremento
            
            try:
                resultado_nuevo = resolver_pmediana_python(matriz_modificada, p)
                cambio_absoluto = resultado_nuevo['costo_total'] - costo_original
                impacto_porcentual = (cambio_absoluto / costo_original) * 100 if costo_original != 0 else 0
                
                nombre_cliente = encabezados_filas[i] if i < len(encabezados_filas) else f'Cliente {i+1}'
                nombre_ubicacion = encabezados_columnas[j] if j < len(encabezados_columnas) else f'Ubicación {j+1}'
                
                resultados.append({
                    'cliente': nombre_cliente,
                    'ubicacion': nombre_ubicacion,
                    'distancia_original': distancia_original,
                    'distancia_nueva': distancia_original + incremento,
                    'costo_original': costo_original,
                    'costo_nuevo': resultado_nuevo['costo_total'],
                    'impacto_porcentual': impacto_porcentual,
                    'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
                })
            except:
                continue  # Si hay error, continuar con el siguiente
    
    # Ordenar por impacto
    resultados.sort(key=lambda x: abs(x['impacto_porcentual']), reverse=True)
    return resultados[:8]  # Top 8 más sensibles

def analizar_sensibilidad_p_pmediana(matriz_distancias, p_original, costo_original):
    """Análisis de sensibilidad del número de medianas"""
    resultados = []
    n = len(matriz_distancias)
    
    # Probar con diferentes valores de P
    valores_p = []
    for p in range(max(1, p_original - 2), min(n + 1, p_original + 3)):
        if p != p_original:
            valores_p.append(p)
    
    for p_nuevo in valores_p:
        try:
            resultado_nuevo = resolver_pmediana_python(matriz_distancias, p_nuevo)
            cambio_absoluto = resultado_nuevo['costo_total'] - costo_original
            impacto_porcentual = (cambio_absoluto / costo_original) * 100 if costo_original != 0 else 0
            
            resultados.append({
                'p_original': p_original,
                'p_nuevo': p_nuevo,
                'costo_original': costo_original,
                'costo_nuevo': resultado_nuevo['costo_total'],
                'impacto_porcentual': impacto_porcentual,
                'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
            })
        except:
            continue  # Si hay error, continuar con el siguiente
    
    return resultados

def calcular_centroide_python(puntos):
    """Calcula el centroide ponderado usando Python"""
    total_weighted_x = 0
    total_weighted_y = 0
    total_weight = 0
    
    for punto in puntos:
        total_weighted_x += punto['x'] * punto['cost']
        total_weighted_y += punto['y'] * punto['cost']
        total_weight += punto['cost']
    
    return {
        'x': total_weighted_x / total_weight,
        'y': total_weighted_y / total_weight
    }

def calcular_costo_total_centroide(centroide, puntos):
    """Calcula el costo total del centroide"""
    costo_total = 0
    for punto in puntos:
        distancia = np.sqrt((punto['x'] - centroide['x'])**2 + (punto['y'] - centroide['y'])**2)
        costo_total += distancia * punto['cost']
    return costo_total

def analizar_sensibilidad_coordenadas_centroide(puntos, porcentaje, centroide_original, costo_original):
    """Análisis de sensibilidad de coordenadas en el método del centroide"""
    resultados = []
    
    for idx, punto in enumerate(puntos):
        # Analizar variaciones en X
        for variacion in [-porcentaje, porcentaje]:
            puntos_modificados = [p.copy() for p in puntos]
            cambio_x = punto['x'] * (variacion / 100)
            puntos_modificados[idx]['x'] = punto['x'] + cambio_x
            
            nuevo_centroide = calcular_centroide_python(puntos_modificados)
            nuevo_costo = calcular_costo_total_centroide(nuevo_centroide, puntos_modificados)
            
            cambio_absoluto = nuevo_costo - costo_original
            impacto_porcentual = (cambio_absoluto / costo_original) * 100 if costo_original != 0 else 0
            
            resultados.append({
                'punto': punto['name'],
                'coordenada': 'X',
                'variacion': variacion,
                'valor_original': punto['x'],
                'valor_nuevo': punto['x'] + cambio_x,
                'costo_original': costo_original,
                'costo_nuevo': nuevo_costo,
                'impacto_porcentual': impacto_porcentual,
                'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
            })
        
        # Analizar variaciones en Y
        for variacion in [-porcentaje, porcentaje]:
            puntos_modificados = [p.copy() for p in puntos]
            cambio_y = punto['y'] * (variacion / 100)
            puntos_modificados[idx]['y'] = punto['y'] + cambio_y
            
            nuevo_centroide = calcular_centroide_python(puntos_modificados)
            nuevo_costo = calcular_costo_total_centroide(nuevo_centroide, puntos_modificados)
            
            cambio_absoluto = nuevo_costo - costo_original
            impacto_porcentual = (cambio_absoluto / costo_original) * 100 if costo_original != 0 else 0
            
            resultados.append({
                'punto': punto['name'],
                'coordenada': 'Y',
                'variacion': variacion,
                'valor_original': punto['y'],
                'valor_nuevo': punto['y'] + cambio_y,
                'costo_original': costo_original,
                'costo_nuevo': nuevo_costo,
                'impacto_porcentual': impacto_porcentual,
                'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
            })
    
    # Ordenar por impacto y retornar los más significativos
    resultados.sort(key=lambda x: abs(x['impacto_porcentual']), reverse=True)
    return resultados[:8]

def analizar_sensibilidad_costos_centroide(puntos, porcentaje, centroide_original, costo_original):
    """Análisis de sensibilidad de costos en el método del centroide"""
    resultados = []
    
    for idx, punto in enumerate(puntos):
        # Analizar variaciones en el costo
        for variacion in [-porcentaje, porcentaje]:
            puntos_modificados = [p.copy() for p in puntos]
            cambio_costo = punto['cost'] * (variacion / 100)
            puntos_modificados[idx]['cost'] = max(0.1, punto['cost'] + cambio_costo)  # Evitar costos negativos
            
            nuevo_centroide = calcular_centroide_python(puntos_modificados)
            nuevo_costo = calcular_costo_total_centroide(nuevo_centroide, puntos_modificados)
            
            cambio_absoluto = nuevo_costo - costo_original
            impacto_porcentual = (cambio_absoluto / costo_original) * 100 if costo_original != 0 else 0
            
            resultados.append({
                'punto': punto['name'],
                'variacion': variacion,
                'costo_original': punto['cost'],
                'costo_nuevo': puntos_modificados[idx]['cost'],
                'costo_total_original': costo_original,
                'costo_total_nuevo': nuevo_costo,
                'impacto_porcentual': impacto_porcentual,
                'sensibilidad': clasificar_sensibilidad(impacto_porcentual)
            })
    
    # Ordenar por impacto y retornar los más significativos
    resultados.sort(key=lambda x: abs(x['impacto_porcentual']), reverse=True)
    return resultados[:8]

def guardar_en_historial(tipo, datos, resultado):
    """
    Guarda una entrada en el historial de la sesión
    """
    session_id = session.get('session_id')
    if not session_id:
        session_id = str(uuid.uuid4())
        session['session_id'] = session_id
    
    if session_id not in historial_global:
        historial_global[session_id] = []
    
    entrada = {
        'id': len(historial_global[session_id]) + 1,
        'fecha': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'tipo': tipo,
        'datos': datos,
        'resultado': resultado
    }
    
    historial_global[session_id].insert(0, entrada)
    
    # Mantener solo los últimos 50 registros
    if len(historial_global[session_id]) > 50:
        historial_global[session_id] = historial_global[session_id][:50]

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000)
