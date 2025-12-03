# database.py - Solo SQLite3 nativo
import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from contextlib import contextmanager

DATABASE_PATH = 'study_tracker.db'

def get_db_connection():
    """Obtiene conexión a la base de datos"""
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # Para acceder por nombre de columna
    return conn

def init_db():
    """Inicializa la base de datos con TODAS las tablas necesarias"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Tabla de usuarios
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        correo TEXT UNIQUE NOT NULL,
        hash_contrasena TEXT NOT NULL,
        nombre TEXT,
        apellido TEXT,
        legajo TEXT UNIQUE,
        rol TEXT DEFAULT 'estudiante',
        nivel INTEGER DEFAULT 1,
        experiencia INTEGER DEFAULT 0,
        monedas INTEGER DEFAULT 0,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')
    
    # Tabla de materias
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS materias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo TEXT UNIQUE NOT NULL,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        creditos INTEGER DEFAULT 0,
        dificultad INTEGER DEFAULT 1,
        semestre INTEGER,
        es_electiva BOOLEAN DEFAULT 0,
        recompensa_xp INTEGER DEFAULT 100,
        recompensa_monedas INTEGER DEFAULT 50,
        id_personaje_jefe INTEGER
    )
    ''')
    
    # Tabla de prerrequisitos (correlativas)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS prerrequisitos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia_id INTEGER NOT NULL,
        prerrequisito_id INTEGER NOT NULL,
        calificacion_minima REAL DEFAULT 4.0,
        es_obligatorio BOOLEAN DEFAULT 1,
        FOREIGN KEY (materia_id) REFERENCES materias(id),
        FOREIGN KEY (prerrequisito_id) REFERENCES materias(id),
        UNIQUE(materia_id, prerrequisito_id)
    )
    ''')
    
    # Tabla de personajes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS personajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        titulo TEXT,
        descripcion TEXT,
        tipo TEXT,
        rareza TEXT DEFAULT 'comun',
        url_imagen TEXT,
        url_avatar TEXT,
        tipo_condicion_desbloqueo TEXT,
        valor_condicion_desbloqueo TEXT,
        inteligencia INTEGER DEFAULT 1,
        carisma INTEGER DEFAULT 1,
        conocimiento INTEGER DEFAULT 1
    )
    ''')
    
    # Tabla de desbloqueos de personajes
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS desbloqueos_personajes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        personaje_id INTEGER NOT NULL,
        fecha_desbloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (personaje_id) REFERENCES personajes(id),
        UNIQUE(usuario_id, personaje_id)
    )
    ''')
    
    # Tabla de insignias
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS insignias (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nombre TEXT NOT NULL,
        descripcion TEXT,
        categoria TEXT,
        icono TEXT,
        puntos INTEGER DEFAULT 10,
        rareza TEXT DEFAULT 'comun',
        tipo_condicion TEXT,
        valor_condicion TEXT
    )
    ''')
    
    # Tabla de insignias de usuarios
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS insignias_usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        insignia_id INTEGER NOT NULL,
        fecha_obtencion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (insignia_id) REFERENCES insignias(id),
        UNIQUE(usuario_id, insignia_id)
    )
    ''')
    
    # Tabla de CLASES (de tu modelo Clase)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS clases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia_id INTEGER NOT NULL,
        numero INTEGER,
        titulo TEXT,
        descripcion TEXT,
        fecha_clase DATE,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        texto_minimo_caracteres INTEGER DEFAULT 100,
        recompensa_xp INTEGER DEFAULT 10,
        FOREIGN KEY (materia_id) REFERENCES materias(id)
    )
    ''')
    
    # Tabla de NOTAS_CLASE (de tu modelo NotaClase)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS notas_clase (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        clase_id INTEGER NOT NULL,
        texto TEXT NOT NULL,
        cantidad_caracteres INTEGER,
        revision_profesor BOOLEAN DEFAULT 0,
        calificacion_profesor INTEGER,
        fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (clase_id) REFERENCES clases(id),
        UNIQUE(usuario_id, clase_id)
    )
    ''')
    
    # Tabla de EXAMENES (de tu modelo Examen)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS examenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        materia_id INTEGER NOT NULL,
        tipo TEXT,  -- 'parcial', 'final', 'recuperatorio', 'trabajo_practico'
        numero INTEGER,
        titulo TEXT,
        descripcion TEXT,
        fecha_examen TIMESTAMP NOT NULL,
        fecha_limite_inscripcion TIMESTAMP,
        aula TEXT,
        edificio TEXT,
        recompensa_xp INTEGER DEFAULT 50,
        recompensa_monedas INTEGER DEFAULT 25,
        FOREIGN KEY (materia_id) REFERENCES materias(id)
    )
    ''')
    
    # Tabla de RESULTADOS_EXAMENES (de tu modelo ResultadoExamen)
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS resultados_examenes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        usuario_id INTEGER NOT NULL,
        examen_id INTEGER NOT NULL,
        calificacion REAL NOT NULL,
        fecha_rendicion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        aprobado BOOLEAN DEFAULT 0,
        comentario_profesor TEXT,
        comentario_estudiante TEXT,
        horas_estudio INTEGER,
        tipo_estudio TEXT,
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
        FOREIGN KEY (examen_id) REFERENCES examenes(id),
        UNIQUE(usuario_id, examen_id)
    )
    ''')
    
    conn.commit()
    conn.close()
    print("✅ Base de datos inicializada con TODAS las tablas")

@contextmanager
def get_db():
    """Context manager para manejar conexiones de DB"""
    conn = get_db_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()