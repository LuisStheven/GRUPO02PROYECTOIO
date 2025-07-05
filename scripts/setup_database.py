"""
Script para configurar la base de datos (opcional)
En el futuro se puede usar para persistir el historial
"""

import sqlite3
import os

def crear_base_datos():
    """Crear base de datos SQLite para el historial"""
    db_path = 'historial.db'
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Crear tabla para el historial
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS historial (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL,
            fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            tipo TEXT NOT NULL,
            datos TEXT NOT NULL,
            resultado TEXT NOT NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print(f"Base de datos creada en: {os.path.abspath(db_path)}")

if __name__ == '__main__':
    crear_base_datos()
