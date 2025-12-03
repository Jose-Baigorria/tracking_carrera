# models.py - Funciones para operar con la base de datos
from database import get_db_connection
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import json

# ========== FUNCIONES DE USUARIO ==========

def crear_usuario(correo, contrasena, nombre='', apellido='', legajo='', rol='estudiante'):
    """Crea un nuevo usuario"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    hash_password = generate_password_hash(contrasena)
    
    cursor.execute('''
        INSERT INTO usuarios (correo, hash_contrasena, nombre, apellido, legajo, rol)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (correo, hash_password, nombre, apellido, legajo, rol))
    
    user_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return user_id

def obtener_usuario_por_correo(correo):
    """Obtiene un usuario por su correo"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios WHERE correo = ?', (correo,))
    usuario = cursor.fetchone()
    
    conn.close()
    return dict(usuario) if usuario else None

def obtener_usuario_por_id(usuario_id):
    """Obtiene un usuario por su ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM usuarios WHERE id = ?', (usuario_id,))
    usuario = cursor.fetchone()
    
    conn.close()
    return dict(usuario) if usuario else None

def verificar_contrasena(usuario, contrasena):
    """Verifica si la contraseña es correcta"""
    return check_password_hash(usuario['hash_contrasena'], contrasena)

# ========== FUNCIONES DE MATERIAS ==========

def obtener_todas_materias():
    """Obtiene todas las materias"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM materias ORDER BY codigo')
    materias = cursor.fetchall()
    
    conn.close()
    return [dict(m) for m in materias]

def obtener_materia_por_id(materia_id):
    """Obtiene una materia por ID"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM materias WHERE id = ?', (materia_id,))
    materia = cursor.fetchone()
    
    conn.close()
    return dict(materia) if materia else None

def obtener_grafo_materias():
    """Devuelve datos para visualizar el grafo de correlativas"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Obtener nodos (materias)
    cursor.execute('SELECT id, codigo, nombre FROM materias')
    materias = cursor.fetchall()
    
    # Obtener aristas (correlativas)
    cursor.execute('''
        SELECT m.codigo as origen, p.codigo as destino
        FROM prerrequisitos pr
        JOIN materias m ON pr.materia_id = m.id
        JOIN materias p ON pr.prerrequisito_id = p.id
    ''')
    correlativas = cursor.fetchall()
    
    conn.close()
    
    return {
        'nodos': [dict(m) for m in materias],
        'aristas': [dict(c) for c in correlativas]
    }

# ========== FUNCIONES DE PERSONAJES ==========

def obtener_todos_personajes():
    """Obtiene todos los personajes"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM personajes ORDER BY rareza, nombre')
    personajes = cursor.fetchall()
    
    conn.close()
    return [dict(p) for p in personajes]

# ========== FUNCIONES DE CLASES ==========

def crear_clase(materia_id, numero, titulo, descripcion='', fecha_clase=None, texto_minimo_caracteres=100, recompensa_xp=10):
    """Crea una nueva clase (subnivel) para una materia"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO clases (materia_id, numero, titulo, descripcion, fecha_clase, texto_minimo_caracteres, recompensa_xp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (materia_id, numero, titulo, descripcion, fecha_clase, texto_minimo_caracteres, recompensa_xp))
    
    clase_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return clase_id

def obtener_clases_de_materia(materia_id):
    """Obtiene todas las clases de una materia"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM clases WHERE materia_id = ? ORDER BY numero', (materia_id,))
    clases = cursor.fetchall()
    
    conn.close()
    return [dict(c) for c in clases]

# ========== FUNCIONES DE NOTAS DE CLASE ==========

def crear_nota_clase(usuario_id, clase_id, texto):
    """Crea o actualiza una nota para una clase"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cantidad_caracteres = len(texto)
    
    # Verificar si ya existe
    cursor.execute('SELECT id FROM notas_clase WHERE usuario_id = ? AND clase_id = ?', (usuario_id, clase_id))
    existe = cursor.fetchone()
    
    if existe:
        cursor.execute('''
            UPDATE notas_clase 
            SET texto = ?, cantidad_caracteres = ?, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE usuario_id = ? AND clase_id = ?
        ''', (texto, cantidad_caracteres, usuario_id, clase_id))
    else:
        cursor.execute('''
            INSERT INTO notas_clase (usuario_id, clase_id, texto, cantidad_caracteres)
            VALUES (?, ?, ?, ?)
        ''', (usuario_id, clase_id, texto, cantidad_caracteres))
    
    conn.commit()
    conn.close()
    return True

# ========== FUNCIONES DE EXÁMENES ==========

def crear_examen(materia_id, tipo, numero, titulo, fecha_examen, descripcion='', 
                 fecha_limite_inscripcion=None, aula='', edificio='', recompensa_xp=50, recompensa_monedas=25):
    """Crea un nuevo examen"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO examenes (materia_id, tipo, numero, titulo, descripcion, fecha_examen, 
                             fecha_limite_inscripcion, aula, edificio, recompensa_xp, recompensa_monedas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (materia_id, tipo, numero, titulo, descripcion, fecha_examen, 
          fecha_limite_inscripcion, aula, edificio, recompensa_xp, recompensa_monedas))
    
    examen_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return examen_id

# ========== INICIALIZACIÓN DE DATOS ==========

def inicializar_datos_prueba():
    """Inicializa la base de datos con datos de prueba"""
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Verificar si ya hay datos
    cursor.execute('SELECT COUNT(*) as count FROM materias')
    if cursor.fetchone()['count'] > 0:
        print("📊 Base de datos ya tiene datos, omitiendo inicialización")
        conn.close()
        return
    
    print("🚀 Inicializando base de datos con datos de prueba...")
    
    # 1. Crear usuario admin
    from werkzeug.security import generate_password_hash
    hash_password = generate_password_hash('admin123')
    
    cursor.execute('''
        INSERT OR IGNORE INTO usuarios (correo, hash_contrasena, nombre, apellido, legajo, rol)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', ('admin@test.com', hash_password, 'Admin', 'Test', '000000', 'administrador'))
    
    # 2. Crear materias de ejemplo
    materias = [
        ('75.01', 'Analisis Matematico I', 'Fundamentos del cálculo diferencial', 6, 3, 1, 100, 50),
        ('75.02', 'Algebra I', 'Algebra lineal y geometría', 6, 3, 1, 100, 50),
        ('75.03', 'Fisica I', 'Mecánica clásica', 6, 3, 1, 100, 50),
        ('75.04', 'Introduccion a la Programacion', 'Programación estructurada', 6, 2, 1, 80, 40),
        ('75.08', 'Analisis Matematico II', 'Cálculo integral y series', 6, 4, 2, 120, 60),
        ('75.09', 'Algebra II', 'Algebra abstracta', 6, 4, 2, 120, 60),
        ('75.41', 'Algoritmos y Programacion I', 'Programación orientada a objetos', 8, 3, 2, 150, 75),
    ]
    
    cursor.executemany('''
        INSERT INTO materias (codigo, nombre, descripcion, creditos, dificultad, semestre, recompensa_xp, recompensa_monedas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', materias)
    
    # 3. Crear correlativas
    cursor.execute('SELECT id, codigo FROM materias')
    materias_dict = {row['codigo']: row['id'] for row in cursor.fetchall()}
    
    correlativas = [
        (materias_dict['75.08'], materias_dict['75.01'], 4.0),  # Analisis II requiere Analisis I
        (materias_dict['75.41'], materias_dict['75.04'], 4.0),  # Algoritmos requiere Introduccion
    ]
    
    cursor.executemany('''
        INSERT INTO prerrequisitos (materia_id, prerrequisito_id, calificacion_minima)
        VALUES (?, ?, ?)
    ''', correlativas)
    
    # 4. Crear clases para Analisis I
    materia_analisis_id = materias_dict['75.01']
    clases = [
        (materia_analisis_id, 1, 'Introduccion a limites', 'Concepto de límite y continuidad', '2024-03-10', 100, 10),
        (materia_analisis_id, 2, 'Continuidad de funciones', 'Tipos de discontinuidad', '2024-03-17', 120, 10),
        (materia_analisis_id, 3, 'Derivadas basicas', 'Reglas de derivación', '2024-03-24', 150, 15),
    ]
    
    cursor.executemany('''
        INSERT INTO clases (materia_id, numero, titulo, descripcion, fecha_clase, texto_minimo_caracteres, recompensa_xp)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', clases)
    
    # 5. Crear examenes para Analisis I
    examenes = [
        (materia_analisis_id, 'parcial', 1, 'Primer Parcial - Unidades 1-3', 'Evaluación de los primeros temas', 
         '2024-04-15 18:00:00', '2024-04-10 23:59:59', 'Aula 101', 'Edificio Principal', 50, 25),
        (materia_analisis_id, 'parcial', 2, 'Segundo Parcial - Unidades 4-6', 'Evaluación de temas avanzados', 
         '2024-06-10 18:00:00', '2024-06-05 23:59:59', 'Aula 205', 'Edificio Principal', 60, 30),
    ]
    
    cursor.executemany('''
        INSERT INTO examenes (materia_id, tipo, numero, titulo, descripcion, fecha_examen, 
                            fecha_limite_inscripcion, aula, edificio, recompensa_xp, recompensa_monedas)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', examenes)
    
    # 6. Crear personajes
    personajes = [
        ('Dr. Matematico', 'Profesor de Analisis', 'Experto en cálculo diferencial', 'profesor', 'raro',
         '/assets/personajes/profesor_matematico.png', None, 'materia_aprobada', '75.01', 8, 3, 9),
        ('Lic. Programador', 'Profesor de Programacion', 'Especialista en algoritmos', 'profesor', 'comun',
         '/assets/personajes/profesor_programacion.png', None, 'materia_aprobada', '75.04', 7, 4, 8),
        ('Jefe de Catedra - Sistemas', 'Jefe de Catedra', 'Director del departamento', 'jefe_catedra', 'epico',
         '/assets/personajes/jefe_catedra.png', None, 'materia_aprobada', '75.41', 9, 8, 10),
    ]
    
    cursor.executemany('''
        INSERT INTO personajes (nombre, titulo, descripcion, tipo, rareza, url_imagen, url_avatar, 
                              tipo_condicion_desbloqueo, valor_condicion_desbloqueo, inteligencia, carisma, conocimiento)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', personajes)
    
    # 7. Crear insignias
    insignias = [
        ('Primer 10', 'Obtener un 10 por primera vez', 'logro', 'primer_10.png', 50, 'raro', 'primer_10', ''),
        ('Racha de 3', 'Aprobar 3 materias consecutivas', 'racha', 'racha_3.png', 30, 'comun', 'racha_3', '3'),
        ('Primera Materia', 'Aprobar tu primera materia', 'hito', 'primera_materia.png', 20, 'comun', 'primera_materia', ''),
        ('Estudiante Eficiente', 'Completar todas las clases de una materia', 'logro', 'estudiante_eficiente.png', 40, 'raro', 'clases_completas', ''),
    ]
    
    cursor.executemany('''
        INSERT INTO insignias (nombre, descripcion, categoria, icono, puntos, rareza, tipo_condicion, valor_condicion)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', insignias)
    
    conn.commit()
    conn.close()
    
    print("✅ Datos de prueba inicializados:")
    print(f"   📚 Materias: {len(materias)}")
    print(f"   👤 Usuarios: 1")
    print(f"   🎮 Personajes: {len(personajes)}")
    print(f"   🏆 Insignias: {len(insignias)}")
    print(f"   📝 Clases: {len(clases)}")
    print(f"   📊 Examenes: {len(examenes)}")