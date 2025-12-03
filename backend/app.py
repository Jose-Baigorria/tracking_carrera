# app.py - Flask con SQLite3 nativo
from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

# Importar nuestros módulos
from database import init_db, get_db_connection
import models

# Cargar variables de entorno
load_dotenv()

# Crear aplicación
app = Flask(__name__)
CORS(app)

# Configuración
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'clave-secreta-temporal')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secreto-temporal')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)

# Inicializar JWT
jwt = JWTManager(app)

# Inicializar base de datos al inicio
with app.app_context():
    init_db()
    models.inicializar_datos_prueba()

# ========== RUTAS BÁSICAS (mantener igual que tenías) ==========

@app.route('/')
def inicio():
    return jsonify({
        'aplicacion': 'Study Tracker Game API',
        'version': '1.0.0',
        'estado': 'ejecutandose',
        'tecnologia': 'Flask + SQLite3 nativo',
        'endpoints': {
            'salud': '/api/salud',
            'registro': '/api/auth/registro (POST)',
            'login': '/api/auth/login (POST)',
            'materias': '/api/materias',
            'grafo_materias': '/api/materias/grafo',
            'personajes': '/api/personajes',
            'insignias': '/api/insignias'
        }
    })

@app.route('/api/salud')
def salud():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT COUNT(*) as count FROM materias')
        count_materias = cursor.fetchone()['count']
        conn.close()
        
        return jsonify({
            'estado': 'saludable',
            'base_datos': 'conectada',
            'materias_en_bd': count_materias,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'estado': 'error', 'mensaje': str(e)}), 500

# ========== AUTENTICACIÓN (mantener igual) ==========

@app.route('/api/auth/registro', methods=['POST'])
def registro():
    # Tu código actual aquí...
    pass

@app.route('/api/auth/login', methods=['POST'])
def login():
    try:
        datos = request.json
        
        if not datos or 'correo' not in datos or 'contrasena' not in datos:
            return jsonify({'error': 'Correo y contraseña son requeridos'}), 400
        
        # Obtener usuario
        usuario = models.obtener_usuario_por_correo(datos['correo'])
        if not usuario:
            return jsonify({'error': 'Credenciales incorrectas'}), 401
        
        # Verificar contraseña
        if not models.verificar_contrasena(usuario, datos['contrasena']):
            return jsonify({'error': 'Credenciales incorrectas'}), 401
        
        # Crear token JWT
        token = create_access_token(
            identity={'id': usuario['id'], 'correo': usuario['correo']},
            expires_delta=timedelta(days=7)
        )
        
        # Obtener datos del usuario (sin hash)
        usuario_dict = dict(usuario)
        usuario_dict.pop('hash_contrasena', None)
        
        return jsonify({
            'mensaje': 'Login exitoso',
            'usuario': usuario_dict,
            'token': token
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== MATERIAS (usar funciones de models.py) ==========

@app.route('/api/materias')
def obtener_materias():
    try:
        materias = models.obtener_todas_materias()
        return jsonify(materias)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/materias/<int:materia_id>')
def obtener_materia(materia_id):
    try:
        materia = models.obtener_materia_por_id(materia_id)
        if not materia:
            return jsonify({'error': 'Materia no encontrada'}), 404
        return jsonify(materia)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/materias/grafo')
def obtener_grafo_materias():
    try:
        grafo = models.obtener_grafo_materias()
        return jsonify(grafo)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== NUEVAS RUTAS PARA CLASES ==========

@app.route('/api/materias/<int:materia_id>/clases', methods=['GET'])
def obtener_clases_materia(materia_id):
    """Obtiene todas las clases de una materia"""
    try:
        clases = models.obtener_clases_de_materia(materia_id)
        return jsonify(clases)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/clases/<int:clase_id>/nota', methods=['POST'])
@jwt_required()
def crear_actualizar_nota_clase(clase_id):
    """Crea o actualiza una nota para una clase"""
    try:
        identidad = get_jwt_identity()
        usuario_id = identidad['id']
        
        datos = request.json
        if not datos or 'texto' not in datos:
            return jsonify({'error': 'Texto es requerido'}), 400
        
        # Verificar que la clase existe
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, texto_minimo_caracteres FROM clases WHERE id = ?', (clase_id,))
        clase = cursor.fetchone()
        conn.close()
        
        if not clase:
            return jsonify({'error': 'Clase no encontrada'}), 404
        
        # Verificar longitud mínima
        texto = datos['texto']
        if len(texto) < clase['texto_minimo_caracteres']:
            return jsonify({
                'error': f'Texto demasiado corto. Mínimo {clase["texto_minimo_caracteres"]} caracteres',
                'caracteres_actuales': len(texto),
                'caracteres_minimos': clase['texto_minimo_caracteres']
            }), 400
        
        # Crear/actualizar nota
        success = models.crear_nota_clase(usuario_id, clase_id, texto)
        
        if success:
            # Otorgar recompensa XP
            conn = get_db_connection()
            cursor = conn.cursor()
            cursor.execute('''
                UPDATE usuarios 
                SET experiencia = experiencia + (SELECT recompensa_xp FROM clases WHERE id = ?)
                WHERE id = ?
            ''', (clase_id, usuario_id))
            conn.commit()
            conn.close()
            
            return jsonify({'mensaje': 'Nota guardada exitosamente', 'recompensa_otorgada': True})
        else:
            return jsonify({'error': 'Error al guardar la nota'}), 500
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== RUTAS PARA PERSONAJES ==========

@app.route('/api/personajes')
def obtener_personajes():
    try:
        personajes = models.obtener_todos_personajes()
        return jsonify(personajes)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== RUTA DE PERFIL PROTEGIDA ==========

@app.route('/api/perfil', methods=['GET'])
@jwt_required()
def obtener_perfil():
    try:
        identidad = get_jwt_identity()
        usuario_id = identidad['id']
        
        with get_db_connection() as conn:
            cursor = conn.cursor()
            
            # Obtener usuario
            cursor.execute('SELECT id, correo, nombre, apellido, nivel, experiencia, monedas FROM usuarios WHERE id = ?', (usuario_id,))
            usuario = cursor.fetchone()
            
            if not usuario:
                return jsonify({'error': 'Usuario no encontrado'}), 404
            
            # Obtener personajes desbloqueados
            cursor.execute('''
                SELECT p.* FROM personajes p
                JOIN desbloqueos_personajes dp ON p.id = dp.personaje_id
                WHERE dp.usuario_id = ?
            ''', (usuario_id,))
            personajes = [dict(row) for row in cursor.fetchall()]
            
            # Obtener insignias
            cursor.execute('''
                SELECT i.* FROM insignias i
                JOIN insignias_usuarios iu ON i.id = iu.insignia_id
                WHERE iu.usuario_id = ?
            ''', (usuario_id,))
            insignias = [dict(row) for row in cursor.fetchall()]
            
            return jsonify({
                'usuario': dict(usuario),
                'personajes_desbloqueados': personajes,
                'insignias': insignias
            })
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ========== MANEJADORES DE ERROR ==========

@app.errorhandler(404)
def no_encontrado(error):
    return jsonify({'error': 'Ruta no encontrada'}), 404

@app.errorhandler(500)
def error_servidor(error):
    return jsonify({'error': 'Error interno del servidor'}), 500

# ========== INICIAR APLICACIÓN ==========

if __name__ == '__main__':
    print("🎮 STUDY TRACKER GAME - BACKEND")
    print("=" * 50)
    print("🚀 Tecnología: Flask + SQLite3 nativo (SIN SQLAlchemy)")
    print("📊 Base de datos: study_tracker.db")
    print("🔗 Servidor: http://localhost:5000")
    print("👤 Usuario demo: admin@test.com / admin123")
    print("=" * 50)
    
    app.run(debug=True, port=5000)