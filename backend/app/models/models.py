# backend/app/models/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, ForeignKey, 
    Table, Float, Date, DateTime, Text, UniqueConstraint,
    DECIMAL, Time, PrimaryKeyConstraint, CheckConstraint, Index
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


# ============================
# Tablas intermedias
# ============================

correlatividades = Table(
    'correlatividades',
    Base.metadata,
    Column('materia_id', String(50), ForeignKey('materias.id'), primary_key=True),
    Column('correlativa_id', String(50), ForeignKey('materias.id'), primary_key=True),
    Column('tipo', String(50), nullable=False),
    Column('obligatoria', Boolean, default=True)
)

# Tabla intermedia para usuarios en grupos de estudio
usuarios_grupos = Table(
    'grupos_estudio_integrantes',
    Base.metadata,
    Column('grupo_id', String(50), ForeignKey('grupos_estudio.id'), primary_key=True),
    Column('usuario_id', String(50), ForeignKey('usuarios.id'), primary_key=True),
    Column('rol', String(50), default='integrante'),
    Column('fecha_union', DateTime, default=func.now()),
    Column('estado', String(50), default='activo')
)

# Tabla intermedia para profesores y materias
profesores_materias = Table(
    'profesores_materias',
    Base.metadata,
    Column('profesor_id', String(50), ForeignKey('profesores.id'), primary_key=True),
    Column('materia_id', String(50), ForeignKey('materias.id'), primary_key=True),
    Column('cargo', String(50)),
    Column('cuatrimestre', String(20))
)

# Tabla intermedia para calificaciones de apuntes
apuntes_calificaciones = Table(
    'apuntes_calificaciones',
    Base.metadata,
    Column('apunte_id', String(50), ForeignKey('apuntes_compartidos.id'), primary_key=True),
    Column('usuario_id', String(50), ForeignKey('usuarios.id'), primary_key=True),
    Column('calificacion', Integer, nullable=False),
    Column('comentario', Text),
    Column('fecha', DateTime, default=func.now())
)

# Tabla intermedia para asistentes a sesiones de grupo
sesiones_grupo_asistentes = Table(
    'sesiones_grupo_asistentes',
    Base.metadata,
    Column('sesion_id', String(50), ForeignKey('sesiones_grupo.id'), primary_key=True),
    Column('usuario_id', String(50), ForeignKey('usuarios.id'), primary_key=True),
    Column('asistio', Boolean, default=False),
    Column('puntual', Boolean, default=True),
    Column('participacion', Integer, default=0)
)


# ============================
# MODELOS PRINCIPALES
# ============================

class Carrera(Base):
    __tablename__ = "carreras"

    id = Column(String(50), primary_key=True)
    codigo = Column(String(20), unique=True, nullable=False)
    nombre = Column(String(200), nullable=False)
    duracion_anios = Column(Integer, default=5)
    creditos_totales = Column(Integer, default=300)
    descripcion = Column(Text)
    color = Column(String(50))
    icono = Column(String(100))
    activa = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, default=func.now())

    # Relaciones
    materias = relationship("Materia", back_populates="carrera")
    usuarios = relationship("Usuario", back_populates="carrera")


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(String(50), primary_key=True)
    legajo = Column(String(50), nullable=False)
    carrera_id = Column(String(50), ForeignKey("carreras.id"), nullable=False)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255))
    fecha_nacimiento = Column(Date)
    telefono = Column(String(20))
    avatar_url = Column(String(500))
    fecha_ingreso = Column(Date)
    fecha_egreso = Column(Date)
    estado = Column(String(50), default='activo')
    promedio_general = Column(Float, default=0.0)
    creditos_aprobados = Column(Integer, default=0)
    ultimo_login = Column(DateTime)
    fecha_registro = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint('legajo', 'carrera_id', name='uq_usuario_legajo_carrera'),
        Index('idx_usuarios_carrera', 'carrera_id'),
        Index('idx_usuarios_legajo', 'legajo'),
    )
    
    # Relaciones
    carrera = relationship("Carrera", back_populates="usuarios")
    inscripciones = relationship("InscripcionMateria", back_populates="usuario")
    notas = relationship("Nota", back_populates="usuario")
    sesiones_estudio = relationship("SesionEstudio", back_populates="usuario")
    flashcards = relationship("FlashCard", back_populates="usuario")
    mazos_flashcards = relationship("MazoFlashCard", back_populates="usuario")
    eventos_planificacion = relationship("EventoPlanificacion", back_populates="usuario")
    grupos_creados = relationship("GrupoEstudio", back_populates="creador")
    grupos_participantes = relationship("GrupoEstudio", secondary=usuarios_grupos, back_populates="integrantes")
    apuntes_compartidos = relationship("ApunteCompartido", back_populates="usuario")
    tutorias_tutor = relationship("Tutoria", foreign_keys="Tutoria.tutor_id", back_populates="tutor")
    tutorias_estudiante = relationship("Tutoria", foreign_keys="Tutoria.estudiante_id", back_populates="estudiante")
    agradecimientos_emisor = relationship("Agradecimiento", foreign_keys="Agradecimiento.emisor_id", back_populates="emisor")
    agradecimientos_receptor = relationship("Agradecimiento", foreign_keys="Agradecimiento.receptor_id", back_populates="receptor")
    logros_desbloqueados = relationship("LogroDesbloqueado", back_populates="usuario")
    logros_progreso = relationship("LogroProgreso", back_populates="usuario")
    ausencias_olvidos = relationship("AusenciaOlvido", back_populates="usuario")
    logins_diarios = relationship("LoginDiario", back_populates="usuario")
    actividad_diaria = relationship("ActividadDiaria", back_populates="usuario")
    configuracion = relationship("ConfiguracionUsuario", back_populates="usuario", uselist=False)
    estadisticas = relationship("EstadisticaUsuario", back_populates="usuario", uselist=False)


class Materia(Base):
    __tablename__ = "materias"

    id = Column(String(50), primary_key=True)
    codigo = Column(String(20), unique=True, nullable=False)
    carrera_id = Column(String(50), ForeignKey("carreras.id"))
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    nivel = Column(Integer, default=1)
    cuatrimestre = Column(Integer)
    modalidad = Column(String(50))
    carga_horaria = Column(Integer)
    creditos = Column(Integer, default=5)
    departamento = Column(String(100))
    es_obligatoria = Column(Boolean, default=True)
    es_electiva = Column(Boolean, default=False)
    es_integradora = Column(Boolean, default=False)
    es_proyecto_final = Column(Boolean, default=False)
    es_basica = Column(Boolean, default=False)
    color = Column(String(50))
    icono = Column(String(100))
    orden = Column(Integer, default=0)
    activa = Column(Boolean, default=True)

    __table_args__ = (
        Index('idx_materias_carrera', 'carrera_id'),
        Index('idx_materias_nivel', 'nivel'),
    )
    
    # Relaciones
    carrera = relationship("Carrera", back_populates="materias")
    inscripciones = relationship("InscripcionMateria", back_populates="materia")
    profesores = relationship("Profesor", secondary=profesores_materias, back_populates="materias")
    correlativas = relationship(
        "Materia",
        secondary=correlatividades,
        primaryjoin=id == correlatividades.c.materia_id,
        secondaryjoin=id == correlatividades.c.correlativa_id,
        backref="correlativa_de"
    )
    sesiones_estudio = relationship("SesionEstudio", back_populates="materia")
    flashcards = relationship("FlashCard", back_populates="materia")
    mazos_flashcards = relationship("MazoFlashCard", back_populates="materia")
    eventos_planificacion = relationship("EventoPlanificacion", back_populates="materia")
    grupos_estudio = relationship("GrupoEstudio", back_populates="materia")
    apuntes_compartidos = relationship("ApunteCompartido", back_populates="materia")
    tutorias = relationship("Tutoria", back_populates="materia")
    agradecimientos = relationship("Agradecimiento", back_populates="materia")
    ausencias_olvidos = relationship("AusenciaOlvido", back_populates="materia")


class InscripcionMateria(Base):
    __tablename__ = "inscripciones"

    id = Column(String(50), primary_key=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"), nullable=False)
    materia_codigo = Column(String(20), nullable=False)
    carrera_id = Column(String(50), ForeignKey("carreras.id"), nullable=False)
    estado = Column(String(50), default='bloqueada')
    intento = Column(Integer, default=1)
    recursada = Column(Boolean, default=False)
    fecha_inscripcion = Column(Date)
    fecha_inicio_cursada = Column(Date)
    fecha_regularizacion = Column(Date)
    fecha_aprobacion = Column(Date)
    cuatrimestre = Column(String(20))
    ano_academico = Column(Integer)
    promocionada = Column(Boolean, default=False)
    nota_final = Column(Float)
    estado_final = Column(String(50))
    observaciones = Column(Text)
    progreso_clases = Column(Integer, default=0)
    total_clases = Column(Integer, default=0)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint('usuario_id', 'materia_id', 'intento', name='uq_inscripcion_usuario_materia_intento'),
        Index('idx_inscripciones_usuario', 'usuario_id'),
        Index('idx_inscripciones_materia', 'materia_id'),
        Index('idx_inscripciones_estado', 'estado'),
    )
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="inscripciones")
    materia = relationship("Materia", back_populates="inscripciones")
    carrera = relationship("Carrera")
    notas = relationship("Nota", back_populates="inscripcion")
    sesiones_estudio = relationship("SesionEstudio", back_populates="inscripcion")
    clases = relationship("Clase", back_populates="inscripcion")
    historial_estados = relationship("HistorialEstadoInscripcion", back_populates="inscripcion")


class Nota(Base):
    __tablename__ = "notas"

    id = Column(String(50), primary_key=True)
    inscripcion_id = Column(String(50), ForeignKey("inscripciones.id"), nullable=False)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"), nullable=False)
    tipo_evaluacion = Column(String(50), nullable=False)
    numero_evaluacion = Column(Integer)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    nota = Column(Float, nullable=False)
    fecha = Column(Date, nullable=False)
    hora = Column(Time)
    es_parcial = Column(Boolean, default=False)
    es_final = Column(Boolean, default=False)
    es_tp = Column(Boolean, default=False)
    es_recuperatorio = Column(Boolean, default=False)
    influye_promedio = Column(Boolean, default=True)
    aprobada = Column(Boolean, default=False)
    cuatrimestre = Column(String(20))
    observaciones = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())

    __table_args__ = (
        Index('idx_notas_usuario', 'usuario_id'),
        Index('idx_notas_materia', 'materia_id'),
        Index('idx_notas_fecha', 'fecha'),
        Index('idx_notas_tipo', 'tipo_evaluacion'),
    )
    
    # Relaciones
    inscripcion = relationship("InscripcionMateria", back_populates="notas")
    usuario = relationship("Usuario", back_populates="notas")
    materia = relationship("Materia")


class SesionEstudio(Base):
    __tablename__ = "sesiones_estudio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"))
    inscripcion_id = Column(String(50), ForeignKey("inscripciones.id"))
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time)
    duracion_minutos = Column(Integer, nullable=False)
    tipo = Column(String(50), default='pomodoro')
    pomodoros_completados = Column(Integer, default=0)
    descripcion = Column(Text)
    eficiencia = Column(Integer, default=0)
    estado_animo = Column(String(50))
    lugar = Column(String(100))
    recursos = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())

    __table_args__ = (
        Index('idx_sesiones_usuario', 'usuario_id'),
        Index('idx_sesiones_fecha', 'fecha'),
    )
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="sesiones_estudio")
    materia = relationship("Materia", back_populates="sesiones_estudio")
    inscripcion = relationship("InscripcionMateria", back_populates="sesiones_estudio")


class FlashCard(Base):
    __tablename__ = "flashcards"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"), nullable=False)
    mazo_id = Column(String(50), ForeignKey("mazos_flashcards.id"))
    pregunta = Column(Text, nullable=False)
    respuesta = Column(Text, nullable=False)
    dificultad = Column(Integer, default=3)
    etiquetas = Column(Text)
    intervalo_dias = Column(Integer, default=1)
    proxima_revision = Column(Date)
    veces_correcta = Column(Integer, default=0)
    veces_incorrecta = Column(Integer, default=0)
    veces_revisada = Column(Integer, default=0)
    ultima_revision = Column(Date)
    estado = Column(String(50), default='activa')
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="flashcards")
    materia = relationship("Materia", back_populates="flashcards")
    mazo = relationship("MazoFlashCard", back_populates="flashcards")


class MazoFlashCard(Base):
    __tablename__ = "mazos_flashcards"

    id = Column(String(50), primary_key=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"), nullable=False)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    color = Column(String(50))
    icono = Column(String(100))
    total_cards = Column(Integer, default=0)
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="mazos_flashcards")
    materia = relationship("Materia", back_populates="mazos_flashcards")
    flashcards = relationship("FlashCard", back_populates="mazo")


class Clase(Base):
    __tablename__ = "clases"

    id = Column(String(50), primary_key=True)
    inscripcion_id = Column(String(50), ForeignKey("inscripciones.id"), nullable=False)
    numero_clase = Column(Integer, nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)
    duracion_minutos = Column(Integer)
    es_checkpoint = Column(Boolean, default=False)
    tipo_checkpoint = Column(String(50))
    asistio = Column(Boolean, default=False)
    participacion = Column(Integer, default=0)
    completada = Column(Boolean, default=False)
    resumen = Column(Text)
    notas = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())

    __table_args__ = (
        UniqueConstraint('inscripcion_id', 'numero_clase', name='uq_clase_inscripcion_numero'),
    )
    
    # Relación
    inscripcion = relationship("InscripcionMateria", back_populates="clases")


class EventoPlanificacion(Base):
    __tablename__ = "planificacion_eventos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time)
    hora_fin = Column(Time)
    tipo = Column(String(50), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"))
    color = Column(String(50), default='#f43f5e')
    prioridad = Column(Integer, default=2)
    completado = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="eventos_planificacion")
    materia = relationship("Materia", back_populates="eventos_planificacion")


class Profesor(Base):
    __tablename__ = "profesores"

    id = Column(String(50), primary_key=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    email = Column(String(100))
    telefono = Column(String(20))
    materia_codigo = Column(String(20))
    rareza = Column(String(50))
    es_jefe_catedra = Column(Boolean, default=False)
    desbloqueado = Column(Boolean, default=False)
    avatar_url = Column(String(500))
    frase = Column(Text)
    especialidad = Column(String(100))
    calificacion = Column(Float, default=5.0)
    total_calificaciones = Column(Integer, default=0)
    
    # Relaciones
    materias = relationship("Materia", secondary=profesores_materias, back_populates="profesores")


# ============================
# LOGROS
# ============================
class CategoriaLogro(Base):
    __tablename__ = "categorias_logros"

    id = Column(String(50), primary_key=True)
    nombre = Column(String(100), nullable=False)
    descripcion = Column(Text)
    color = Column(String(50), nullable=False)
    icono = Column(String(100), nullable=False)
    orden = Column(Integer, default=0)
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relación
    logros = relationship("Logro", back_populates="categoria")


class Logro(Base):
    __tablename__ = "logros"

    id = Column(String(50), primary_key=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text, nullable=False)
    icono = Column(String(100), nullable=False)
    categoria_id = Column(String(50), ForeignKey("categorias_logros.id"), nullable=False)
    rareza = Column(String(50), default='comun')
    puntos = Column(Integer, default=10)
    desbloqueado = Column(Boolean, default=False)
    fecha_desbloqueo = Column(DateTime)
    progreso_actual = Column(Integer, default=0)
    progreso_requerido = Column(Integer, default=1)
    tipo_condicion = Column(String(50))
    datos_extra = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_modificacion = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_logros_categoria', 'categoria_id'),
    )
    
    # Relaciones
    categoria = relationship("CategoriaLogro", back_populates="logros")
    desbloqueados = relationship("LogroDesbloqueado", back_populates="logro")
    progresos = relationship("LogroProgreso", back_populates="logro")


class LogroDesbloqueado(Base):
    __tablename__ = "logros_desbloqueados"

    id = Column(String(50), primary_key=True)
    logro_id = Column(String(50), ForeignKey("logros.id"), nullable=False)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    fecha_desbloqueo = Column(DateTime, default=func.now())
    datos_contexto = Column(Text)
    notificado = Column(Boolean, default=False)

    __table_args__ = (
        UniqueConstraint('logro_id', 'usuario_id', name='uq_logro_usuario'),
        Index('idx_logros_desbloqueados_usuario', 'usuario_id'),
        Index('idx_logros_desbloqueados_logro', 'logro_id'),
    )
    
    # Relaciones
    logro = relationship("Logro", back_populates="desbloqueados")
    usuario = relationship("Usuario", back_populates="logros_desbloqueados")


class LogroProgreso(Base):
    __tablename__ = "logros_progreso"

    id = Column(String(50), primary_key=True)
    logro_id = Column(String(50), ForeignKey("logros.id"), nullable=False)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    progreso_actual = Column(Integer, default=0)
    progreso_requerido = Column(Integer, default=1)
    completado = Column(Boolean, default=False)
    fecha_inicio = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        UniqueConstraint('logro_id', 'usuario_id', name='uq_logro_progreso_usuario'),
    )
    
    # Relaciones
    logro = relationship("Logro", back_populates="progresos")
    usuario = relationship("Usuario", back_populates="logros_progreso")


# ============================
# MODELOS SOCIALES
# ============================
class GrupoEstudio(Base):
    __tablename__ = "grupos_estudio"

    id = Column(String(50), primary_key=True)
    nombre = Column(String(200), nullable=False)
    descripcion = Column(Text)
    creador_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"))
    max_integrantes = Column(Integer, default=10)
    integrantes_actuales = Column(Integer, default=1)
    privado = Column(Boolean, default=False)
    codigo_invitacion = Column(String(50), unique=True)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    activo = Column(Boolean, default=True)

    __table_args__ = (
        Index('idx_grupos_creador', 'creador_id'),
    )
    
    # Relaciones
    creador = relationship("Usuario", back_populates="grupos_creados")
    materia = relationship("Materia", back_populates="grupos_estudio")
    integrantes = relationship("Usuario", secondary=usuarios_grupos, back_populates="grupos_participantes")
    sesiones = relationship("SesionGrupo", back_populates="grupo")


class SesionGrupo(Base):
    __tablename__ = "sesiones_grupo"

    id = Column(String(50), primary_key=True)
    grupo_id = Column(String(50), ForeignKey("grupos_estudio.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time)
    duracion_minutos = Column(Integer)
    tema = Column(String(200))
    descripcion = Column(Text)
    lugar = Column(String(100))
    asistentes = Column(Integer, default=0)
    satisfaccion = Column(Integer, default=0)
    fecha_creacion = Column(DateTime, default=func.now())
    
    # Relaciones
    grupo = relationship("GrupoEstudio", back_populates="sesiones")
    asistentes_rel = relationship("Usuario", secondary=sesiones_grupo_asistentes, backref="sesiones_asistidas")


class ApunteCompartido(Base):
    __tablename__ = "apuntes_compartidos"

    id = Column(String(50), primary_key=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    contenido = Column(Text)
    formato = Column(String(50), default='texto')
    url_archivo = Column(String(500))
    compartido_publicamente = Column(Boolean, default=False)
    veces_descargado = Column(Integer, default=0)
    veces_visto = Column(Integer, default=0)
    calificacion_promedio = Column(Float, default=0.0)
    total_calificaciones = Column(Integer, default=0)
    fecha_compartido = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    activo = Column(Boolean, default=True)

    __table_args__ = (
        Index('idx_apuntes_usuario', 'usuario_id'),
    )
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="apuntes_compartidos")
    materia = relationship("Materia", back_populates="apuntes_compartidos")
    calificaciones = relationship("Usuario", secondary=apuntes_calificaciones, backref="apuntes_calificados")


class Tutoria(Base):
    __tablename__ = "tutorias"

    id = Column(String(50), primary_key=True)
    tutor_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    estudiante_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"), nullable=False)
    titulo = Column(String(200), nullable=False)
    descripcion = Column(Text)
    fecha = Column(Date, nullable=False)
    hora_inicio = Column(Time, nullable=False)
    hora_fin = Column(Time)
    duracion_minutos = Column(Integer)
    modalidad = Column(String(50), default='presencial')
    lugar = Column(String(200))
    remunerada = Column(Boolean, default=False)
    monto = Column(DECIMAL(10, 2))
    estado = Column(String(50), default='programada')
    exito = Column(Boolean, default=False)
    calificacion_tutor = Column(Integer)
    calificacion_estudiante = Column(Integer)
    feedback_tutor = Column(Text)
    feedback_estudiante = Column(Text)
    fecha_creacion = Column(DateTime, default=func.now())
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())

    __table_args__ = (
        Index('idx_tutorias_tutor', 'tutor_id'),
        Index('idx_tutorias_estudiante', 'estudiante_id'),
    )
    
    # Relaciones
    tutor = relationship("Usuario", foreign_keys=[tutor_id], back_populates="tutorias_tutor")
    estudiante = relationship("Usuario", foreign_keys=[estudiante_id], back_populates="tutorias_estudiante")
    materia = relationship("Materia", back_populates="tutorias")


class Agradecimiento(Base):
    __tablename__ = "agradecimientos"

    id = Column(String(50), primary_key=True)
    emisor_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    receptor_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    descripcion = Column(Text, nullable=False)
    materia_id = Column(String(50), ForeignKey("materias.id"))
    fecha = Column(DateTime, default=func.now())
    
    # Relaciones
    emisor = relationship("Usuario", foreign_keys=[emisor_id], back_populates="agradecimientos_emisor")
    receptor = relationship("Usuario", foreign_keys=[receptor_id], back_populates="agradecimientos_receptor")
    materia = relationship("Materia", back_populates="agradecimientos")


# ============================
# MODELOS PARA LOGROS NEGATIVOS/DESAFÍOS
# ============================
class AusenciaOlvido(Base):
    __tablename__ = "ausencias_olvidos"

    id = Column(String(50), primary_key=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    tipo = Column(String(50), nullable=False)
    razon = Column(String(100))
    fecha = Column(Date, nullable=False)
    hora = Column(Time)
    materia_id = Column(String(50), ForeignKey("materias.id"))
    evaluacion_id = Column(String(50))
    examen_importante = Column(Boolean, default=False)
    evaluacion_importante = Column(Boolean, default=False)
    justificado = Column(Boolean, default=False)
    observaciones = Column(Text)
    fecha_registro = Column(DateTime, default=func.now())
    
    # Relaciones
    usuario = relationship("Usuario", back_populates="ausencias_olvidos")
    materia = relationship("Materia", back_populates="ausencias_olvidos")


class HistorialEstadoInscripcion(Base):
    __tablename__ = "historial_estados_inscripcion"

    id = Column(String(50), primary_key=True)
    inscripcion_id = Column(String(50), ForeignKey("inscripciones.id"), nullable=False)
    estado_anterior = Column(String(50))
    estado_nuevo = Column(String(50), nullable=False)
    motivo = Column(String(200))
    fecha_cambio = Column(DateTime, default=func.now())
    
    # Relación
    inscripcion = relationship("InscripcionMateria", back_populates="historial_estados")


# ============================
# MODELOS PARA SEGUIMIENTO TEMPORAL
# ============================
class LoginDiario(Base):
    __tablename__ = "logins_diarios"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora = Column(Time)
    dispositivo = Column(String(100))
    ip_address = Column(String(50))

    __table_args__ = (
        UniqueConstraint('usuario_id', 'fecha', name='uq_login_usuario_fecha'),
        Index('idx_logins_diarios_usuario', 'usuario_id'),
        Index('idx_logins_diarios_fecha', 'fecha'),
    )
    
    # Relación
    usuario = relationship("Usuario", back_populates="logins_diarios")


class ActividadDiaria(Base):
    __tablename__ = "actividad_diaria"

    id = Column(Integer, primary_key=True, autoincrement=True)
    usuario_id = Column(String(50), ForeignKey("usuarios.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    minutos_estudiados = Column(Integer, default=0)
    sesiones_completadas = Column(Integer, default=0)
    flashcards_revisadas = Column(Integer, default=0)
    clases_asistidas = Column(Integer, default=0)
    notas_creadas = Column(Integer, default=0)
    logros_desbloqueados = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint('usuario_id', 'fecha', name='uq_actividad_usuario_fecha'),
    )
    
    # Relación
    usuario = relationship("Usuario", back_populates="actividad_diaria")


# ============================
# MODELOS DE CONFIGURACIÓN Y METADATOS
# ============================
class ConfiguracionUsuario(Base):
    __tablename__ = "configuracion_usuario"

    usuario_id = Column(String(50), ForeignKey("usuarios.id"), primary_key=True)
    notificaciones_email = Column(Boolean, default=True)
    notificaciones_push = Column(Boolean, default=True)
    tema = Column(String(50), default='claro')
    idioma = Column(String(10), default='es')
    privacidad_perfil = Column(String(20), default='publico')
    hora_inicio_estudio = Column(Time, default='09:00')
    hora_fin_estudio = Column(Time, default='18:00')
    duracion_pomodoro = Column(Integer, default=25)
    descanso_corto = Column(Integer, default=5)
    descanso_largo = Column(Integer, default=15)
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relación
    usuario = relationship("Usuario", back_populates="configuracion")


class EstadisticaUsuario(Base):
    __tablename__ = "estadisticas_usuario"

    usuario_id = Column(String(50), ForeignKey("usuarios.id"), primary_key=True)
    total_horas_estudio = Column(Integer, default=0)
    total_sesiones = Column(Integer, default=0)
    total_pomodoros = Column(Integer, default=0)
    total_notas = Column(Integer, default=0)
    total_materias_aprobadas = Column(Integer, default=0)
    total_logros_desbloqueados = Column(Integer, default=0)
    promedio_general = Column(Float, default=0.0)
    mejor_promedio_cuatri = Column(Float, default=0.0)
    racha_actual_dias = Column(Integer, default=0)
    mejor_racha_dias = Column(Integer, default=0)
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    
    # Relación
    usuario = relationship("Usuario", back_populates="estadisticas")