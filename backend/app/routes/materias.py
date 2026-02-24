# backend/app/routes/materias.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import (
    Materia, InscripcionMateria, Nota, Profesor, Clase, 
    Logro, LogroDesbloqueado, LogroProgreso, CategoriaLogro, 
    FlashCard, SesionEstudio, EventoPlanificacion,
    Usuario, Carrera, MazoFlashCard
)
from app.services.logros_service import LogroService  # Importar el servicio de logros
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
import uuid
from app.core.security import get_current_user

router = APIRouter()

# --- SCHEMAS ACTUALIZADOS (sin usuario_id) ---
class NotaCreate(BaseModel):
    inscripcion_id: str
    titulo: str
    nota: float
    fecha: date
    tipo_evaluacion: str
    es_parcial: bool = False
    es_final: bool = False
    es_tp: bool = False
    es_recuperatorio: bool = False
    influye_promedio: bool = True
    observaciones: Optional[str] = None
    cuatrimestre: Optional[str] = None
    numero_evaluacion: Optional[int] = None

class NotaUpdate(BaseModel):
    titulo: Optional[str] = None
    nota: Optional[float] = None
    fecha: Optional[date] = None
    tipo_evaluacion: Optional[str] = None
    es_parcial: Optional[bool] = None
    es_final: Optional[bool] = None
    es_tp: Optional[bool] = None
    es_recuperatorio: Optional[bool] = None
    influye_promedio: Optional[bool] = None
    observaciones: Optional[str] = None
    cuatrimestre: Optional[str] = None

class ClaseCreate(BaseModel):
    inscripcion_id: str
    numero_clase: int
    titulo: str
    fecha: date
    descripcion: Optional[str] = None
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    duracion_minutos: Optional[int] = None
    es_checkpoint: bool = False
    tipo_checkpoint: Optional[str] = None
    asistio: bool = False
    participacion: int = 0
    completada: bool = False
    resumen: Optional[str] = None
    notas: Optional[str] = None

class InscripcionCreate(BaseModel):
    materia_id: str
    materia_codigo: str
    carrera_id: str
    estado: str = "bloqueada"
    intento: int = 1
    recursada: bool = False
    fecha_inscripcion: Optional[date] = None
    cuatrimestre: Optional[str] = None
    ano_academico: Optional[int] = None

class FlashcardCreate(BaseModel):
    materia_id: str
    mazo_id: Optional[str] = None
    pregunta: str
    respuesta: str
    dificultad: int = 3
    etiquetas: Optional[str] = None
    intervalo_dias: int = 1

class SesionCreate(BaseModel):
    materia_id: Optional[str] = None
    inscripcion_id: Optional[str] = None
    fecha: date
    hora_inicio: time
    hora_fin: Optional[time] = None
    duracion_minutos: int
    tipo: str = "pomodoro"
    pomodoros_completados: int = 0
    descripcion: Optional[str] = None
    eficiencia: int = 0
    estado_animo: Optional[str] = None
    lugar: Optional[str] = None
    recursos: Optional[str] = None

class EventoCreate(BaseModel):
    titulo: str
    descripcion: Optional[str] = None
    fecha: date
    hora_inicio: Optional[time] = None
    hora_fin: Optional[time] = None
    tipo: str
    materia_id: Optional[str] = None
    color: str = "#f43f5e"
    prioridad: int = 2
    completado: bool = False

# --- FUNCIÓN AUXILIAR PARA VERIFICAR LOGROS ---
def verificar_logros_usuario(db: Session, usuario_id: str):
    """Función auxiliar para verificar y desbloquear logros para un usuario"""
    try:
        logros_desbloqueados = LogroService.verificar_y_desbloquear_logros(db, usuario_id)
        if logros_desbloqueados:
            print(f"🎉 Nuevos logros desbloqueados para usuario {usuario_id}: {logros_desbloqueados}")
        return logros_desbloqueados
    except Exception as e:
        print(f"⚠️ Error verificando logros: {e}")
        return []

# --- RUTAS DE MATERIAS Y DASHBOARD ---

@router.get("/dashboard-stats")
def get_stats(
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener estadísticas del dashboard del usuario autenticado"""
    usuario_id = current_user.id
    
    # Obtener inscripciones del usuario
    inscripciones = db.query(InscripcionMateria).filter(
        InscripcionMateria.usuario_id == usuario_id
    ).all()
    
    # Obtener notas del usuario que influyen en el promedio
    notas = db.query(Nota).filter(
        Nota.usuario_id == usuario_id,
        Nota.influye_promedio == True,
        Nota.nota >= 0  # Excluir notas centinela (-1)
    ).all()
    
    # Calcular promedio
    promedio = sum([n.nota for n in notas]) / len(notas) if notas else 0
    
    # Contar por estado
    aprobadas = len([i for i in inscripciones if i.estado == "aprobada"])
    cursando = len([i for i in inscripciones if i.estado == "cursando"])
    bloqueadas = len([i for i in inscripciones if i.estado == "bloqueada"])
    regularizadas = len([i for i in inscripciones if i.estado == "regular"])
    
    return {
        "aprobadas": aprobadas,
        "cursando": cursando,
        "bloqueadas": bloqueadas,
        "regularizadas": regularizadas,
        "total": len(inscripciones),
        "promedio_general": round(promedio, 2),
        "creditos_aprobados": sum([1 for i in inscripciones if i.estado == "aprobada"]) * 5
    }

@router.get("/materias")
def list_materias(
    carrera_id: Optional[str] = None,
    es_electiva: Optional[bool] = None,
    nivel: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """Listar materias con filtros opcionales"""
    query = db.query(Materia)
    
    if carrera_id:
        query = query.filter(Materia.carrera_id == carrera_id)
    
    if es_electiva is not None:
        query = query.filter(Materia.es_electiva == es_electiva)
    
    if nivel is not None:
        query = query.filter(Materia.nivel == nivel)
    
    query = query.order_by(Materia.nivel.asc(), Materia.orden.asc())
    
    return query.all()

# --- RUTAS DE CORRELATIVIDADES ---

@router.get("/materias/correlatividades")
def list_correlatividades(
    materia_id: Optional[str] = None,
    tipo: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Listar correlatividades con filtros"""
    from app.models.models import correlatividades
    
    query = correlatividades.select()
    
    if materia_id:
        query = query.where(correlatividades.c.materia_id == materia_id)
    
    if tipo:
        query = query.where(correlatividades.c.tipo == tipo)
    
    results = db.execute(query).all()
    
    # Obtener información de las materias correlativas
    correlativas_detalle = []
    for r in results:
        materia_correlativa = db.query(Materia).filter(Materia.id == r.correlativa_id).first()
        
        if materia_correlativa:
            correlativas_detalle.append({
                "materia_id": r.materia_id,
                "correlativa_id": r.correlativa_id,
                "tipo": r.tipo,
                "obligatoria": r.obligatoria,
                "correlativa_info": {
                    "codigo": materia_correlativa.codigo,
                    "nombre": materia_correlativa.nombre,
                    "nivel": materia_correlativa.nivel,
                    "creditos": materia_correlativa.creditos
                }
            })
    
    return correlativas_detalle

@router.get("/materias/{materia_id}")
def get_materia_detalle(materia_id: str, db: Session = Depends(get_db)):
    """Obtener detalle de una materia específica"""
    materia = db.query(Materia).filter(Materia.id == materia_id).first()
    if not materia:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    # Obtener correlatividades
    from app.models.models import correlatividades
    correlativas = db.execute(
        correlatividades.select().where(correlatividades.c.materia_id == materia_id)
    ).fetchall()
    
    # Obtener profesores
    profesores = db.query(Profesor).join(
        Profesor.materias
    ).filter(Materia.id == materia_id).all()
    
    return {
        "materia": materia,
        "correlativas": [
            {
                "materia_id": c.correlativa_id,
                "tipo": c.tipo,
                "obligatoria": c.obligatoria
            } for c in correlativas
        ],
        "profesores": profesores
    }

# --- RUTAS DE INSCRIPCIONES ---

@router.get("/inscripciones")
def list_inscripciones(
    materia_id: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar inscripciones del usuario autenticado con filtros"""
    usuario_id = current_user.id
    query = db.query(InscripcionMateria).options(
        joinedload(InscripcionMateria.materia),
        joinedload(InscripcionMateria.usuario),
        joinedload(InscripcionMateria.carrera)
    ).filter(InscripcionMateria.usuario_id == usuario_id)
    
    if materia_id:
        query = query.filter(InscripcionMateria.materia_id == materia_id)
    
    if estado:
        query = query.filter(InscripcionMateria.estado == estado)
    
    return query.all()

@router.post("/inscripciones")
def crear_inscripcion(
    data: InscripcionCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una nueva inscripción a materia para el usuario autenticado"""
    usuario_id = current_user.id
    
    # Verificar si ya existe inscripción para este usuario y materia
    existe = db.query(InscripcionMateria).filter(
        InscripcionMateria.usuario_id == usuario_id,
        InscripcionMateria.materia_id == data.materia_id,
        InscripcionMateria.intento == data.intento
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400, 
            detail=f"Ya existe una inscripción para esta materia (intento {data.intento})"
        )
    
    # Generar ID único
    insc_id = f"insc_{uuid.uuid4().hex[:10]}"
    
    # Crear nueva inscripción
    nueva_insc = InscripcionMateria(
        id=insc_id,
        usuario_id=usuario_id,
        materia_id=data.materia_id,
        materia_codigo=data.materia_codigo,
        carrera_id=data.carrera_id,
        estado=data.estado,
        intento=data.intento,
        recursada=data.recursada,
        fecha_inscripcion=data.fecha_inscripcion or datetime.now().date(),
        cuatrimestre=data.cuatrimestre,
        ano_academico=data.ano_academico,
        progreso_clases=0,
        total_clases=0
    )
    
    db.add(nueva_insc)
    db.commit()
    db.refresh(nueva_insc)
    
    # VERIFICAR LOGROS después de crear inscripción
    verificar_logros_usuario(db, usuario_id)
    
    return nueva_insc

@router.get("/inscripciones/{insc_id}")
def get_inscripcion_detalle(
    insc_id: str, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener detalle de una inscripción (solo del usuario autenticado)"""
    usuario_id = current_user.id
    insc = db.query(InscripcionMateria).options(
        joinedload(InscripcionMateria.materia),
        joinedload(InscripcionMateria.usuario),
        joinedload(InscripcionMateria.carrera),
        joinedload(InscripcionMateria.notas),
        joinedload(InscripcionMateria.clases)
    ).filter(
        InscripcionMateria.id == insc_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not insc:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    return insc

@router.patch("/inscripciones/{insc_id}")
def update_inscripcion(
    insc_id: str, 
    data: dict, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar una inscripción del usuario autenticado"""
    usuario_id = current_user.id
    insc = db.query(InscripcionMateria).filter(
        InscripcionMateria.id == insc_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not insc:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Campos permitidos para actualización
    allowed_fields = [
        'estado', 'cuatrimestre', 'ano_academico', 'promocionada',
        'nota_final', 'estado_final', 'observaciones', 'progreso_clases',
        'total_clases', 'fecha_regularizacion', 'fecha_aprobacion'
    ]
    
    for key, value in data.items():
        if hasattr(insc, key) and key in allowed_fields:
            # Manejar fechas especiales
            if key in ['fecha_regularizacion', 'fecha_aprobacion'] and value:
                if isinstance(value, str):
                    value = datetime.strptime(value, "%Y-%m-%d").date()
            setattr(insc, key, value)
    
    insc.fecha_actualizacion = datetime.now()
    db.commit()
    
    # VERIFICAR LOGROS después de actualizar inscripción
    verificar_logros_usuario(db, usuario_id)
    
    return insc

@router.delete("/inscripciones/{insc_id}")
def eliminar_inscripcion(
    insc_id: str, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar una inscripción y sus datos relacionados (solo del usuario autenticado)"""
    usuario_id = current_user.id
    insc = db.query(InscripcionMateria).filter(
        InscripcionMateria.id == insc_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not insc:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Eliminar notas relacionadas
    db.query(Nota).filter(Nota.inscripcion_id == insc_id).delete()
    
    # Eliminar clases relacionadas
    db.query(Clase).filter(Clase.inscripcion_id == insc_id).delete()
    
    # Eliminar la inscripción
    db.delete(insc)
    db.commit()
    
    # VERIFICAR LOGROS después de eliminar inscripción
    verificar_logros_usuario(db, usuario_id)
    
    return {"status": "ok", "message": "Inscripción eliminada correctamente"}

# --- RUTAS DE NOTAS ---

@router.get("/notas")
def list_notas(
    inscripcion_id: Optional[str] = None,
    materia_id: Optional[str] = None,
    tipo_evaluacion: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar notas del usuario autenticado con filtros"""
    usuario_id = current_user.id
    query = db.query(Nota).options(
        joinedload(Nota.inscripcion),
        joinedload(Nota.usuario),
        joinedload(Nota.materia)
    ).filter(Nota.usuario_id == usuario_id)
    
    if inscripcion_id:
        query = query.filter(Nota.inscripcion_id == inscripcion_id)
    
    if materia_id:
        query = query.filter(Nota.materia_id == materia_id)
    
    if tipo_evaluacion:
        query = query.filter(Nota.tipo_evaluacion == tipo_evaluacion)
    
    return query.order_by(Nota.fecha.desc()).all()

@router.post("/notas")
def crear_nota(
    data: NotaCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una nueva nota para una inscripción del usuario autenticado"""
    usuario_id = current_user.id
    
    # Verificar que la inscripción existe y pertenece al usuario
    inscripcion = db.query(InscripcionMateria).filter(
        InscripcionMateria.id == data.inscripcion_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Generar ID
    nota_id = f"nota_{uuid.uuid4().hex[:10]}"
    
    # Determinar si está aprobada (nota >= 4)
    aprobada = data.nota >= 4 if data.nota >= 0 else False
    
    # Crear la nota
    nueva_nota = Nota(
        id=nota_id,
        inscripcion_id=data.inscripcion_id,
        usuario_id=usuario_id,
        materia_id=inscripcion.materia_id,
        tipo_evaluacion=data.tipo_evaluacion,
        numero_evaluacion=data.numero_evaluacion,
        titulo=data.titulo,
        nota=data.nota,
        fecha=data.fecha,
        es_parcial=data.es_parcial,
        es_final=data.es_final,
        es_tp=data.es_tp,
        es_recuperatorio=data.es_recuperatorio,
        influye_promedio=data.influye_promedio,
        aprobada=aprobada,
        cuatrimestre=data.cuatrimestre,
        observaciones=data.observaciones
    )
    
    db.add(nueva_nota)
    
    # Si la nota es final y está aprobada, actualizar el estado de la inscripción
    if data.es_final and aprobada and data.nota >= 4:
        inscripcion.estado = "aprobada"
        inscripcion.fecha_aprobacion = data.fecha
        inscripcion.nota_final = data.nota
        inscripcion.estado_final = "promocionado" if data.nota >= 7 else "aprobado"
    
    db.commit()
    db.refresh(nueva_nota)
    
    # VERIFICAR LOGROS después de crear nota
    logros_desbloqueados = verificar_logros_usuario(db, usuario_id)
    
    # Devolver también los logros desbloqueados en la respuesta
    response = {
        "nota": nueva_nota,
        "logros_desbloqueados": logros_desbloqueados
    }
    
    return response

@router.patch("/notas/{nota_id}")
def actualizar_nota(
    nota_id: str, 
    data: NotaUpdate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar una nota existente del usuario autenticado"""
    usuario_id = current_user.id
    nota = db.query(Nota).filter(
        Nota.id == nota_id,
        Nota.usuario_id == usuario_id
    ).first()
    
    if not nota:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    
    # Guardar la nota anterior para comparar
    nota_anterior = nota.nota
    
    update_data = data.dict(exclude_unset=True)
    
    # Actualizar campos
    for key, value in update_data.items():
        if hasattr(nota, key):
            setattr(nota, key, value)
    
    # Recalcular si está aprobada
    if 'nota' in update_data:
        nota.aprobada = nota.nota >= 4 if nota.nota >= 0 else False
        
        # Si cambió la nota y es final, actualizar la inscripción
        if nota.es_final and nota.aprobada and nota.nota >= 4:
            inscripcion = db.query(InscripcionMateria).filter(
                InscripcionMateria.id == nota.inscripcion_id,
                InscripcionMateria.usuario_id == usuario_id
            ).first()
            if inscripcion:
                inscripcion.estado = "aprobada"
                inscripcion.fecha_aprobacion = nota.fecha or datetime.now().date()
                inscripcion.nota_final = nota.nota
                inscripcion.estado_final = "promocionado" if nota.nota >= 7 else "aprobado"
    
    db.commit()
    db.refresh(nota)
    
    # VERIFICAR LOGROS después de actualizar nota (solo si cambió la nota)
    if 'nota' in update_data and nota_anterior != nota.nota:
        logros_desbloqueados = verificar_logros_usuario(db, usuario_id)
        return {
            "nota": nota,
            "logros_desbloqueados": logros_desbloqueados
        }
    
    return nota

@router.delete("/notas/{nota_id}")
def eliminar_nota(
    nota_id: str, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar una nota del usuario autenticado"""
    usuario_id = current_user.id
    nota = db.query(Nota).filter(
        Nota.id == nota_id,
        Nota.usuario_id == usuario_id
    ).first()
    
    if not nota:
        raise HTTPException(status_code=404, detail="Nota no encontrada")
    
    db.delete(nota)
    db.commit()
    
    # VERIFICAR LOGROS después de eliminar nota
    logros_desbloqueados = verificar_logros_usuario(db, usuario_id)
    
    return {
        "status": "ok", 
        "message": "Nota eliminada correctamente",
        "logros_desbloqueados": logros_desbloqueados
    }

# --- RUTAS DE CLASES ---

@router.get("/clases")
def list_clases(
    inscripcion_id: Optional[str] = None,
    completada: Optional[bool] = None,
    es_checkpoint: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar clases del usuario autenticado con filtros"""
    usuario_id = current_user.id
    query = db.query(Clase).options(joinedload(Clase.inscripcion))
    
    if inscripcion_id:
        # Verificar que la inscripción pertenezca al usuario
        inscripcion = db.query(InscripcionMateria).filter(
            InscripcionMateria.id == inscripcion_id,
            InscripcionMateria.usuario_id == usuario_id
        ).first()
        if not inscripcion:
            raise HTTPException(status_code=404, detail="Inscripción no encontrada")
        query = query.filter(Clase.inscripcion_id == inscripcion_id)
    
    if completada is not None:
        query = query.filter(Clase.completada == completada)
    
    if es_checkpoint is not None:
        query = query.filter(Clase.es_checkpoint == es_checkpoint)
    
    return query.order_by(Clase.numero_clase.asc()).all()

@router.post("/clases")
def crear_clase(
    data: ClaseCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una nueva clase para una inscripción del usuario autenticado"""
    usuario_id = current_user.id
    
    # Verificar que la inscripción existe y pertenece al usuario
    inscripcion = db.query(InscripcionMateria).filter(
        InscripcionMateria.id == data.inscripcion_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not inscripcion:
        raise HTTPException(status_code=404, detail="Inscripción no encontrada")
    
    # Verificar que no exista ya una clase con ese número
    existe = db.query(Clase).filter(
        Clase.inscripcion_id == data.inscripcion_id,
        Clase.numero_clase == data.numero_clase
    ).first()
    
    if existe:
        raise HTTPException(
            status_code=400, 
            detail=f"Ya existe una clase con el número {data.numero_clase} para esta inscripción"
        )
    
    # Generar ID
    clase_id = f"clase_{uuid.uuid4().hex[:10]}"
    
    # Crear la clase
    nueva_clase = Clase(
        id=clase_id,
        inscripcion_id=data.inscripcion_id,
        numero_clase=data.numero_clase,
        titulo=data.titulo,
        descripcion=data.descripcion,
        fecha=data.fecha,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        duracion_minutos=data.duracion_minutos,
        es_checkpoint=data.es_checkpoint,
        tipo_checkpoint=data.tipo_checkpoint,
        asistio=data.asistio,
        participacion=data.participacion,
        completada=data.completada,
        resumen=data.resumen,
        notas=data.notas
    )
    
    db.add(nueva_clase)
    
    # Actualizar progreso de clases en la inscripción
    if data.completada:
        inscripcion.progreso_clases = inscripcion.progreso_clases + 1
    
    # Actualizar total de clases si es mayor
    if data.numero_clase > inscripcion.total_clases:
        inscripcion.total_clases = data.numero_clase
    
    db.commit()
    db.refresh(nueva_clase)
    
    # VERIFICAR LOGROS después de crear clase
    verificar_logros_usuario(db, usuario_id)
    
    return nueva_clase

@router.patch("/clases/{clase_id}")
def actualizar_clase(
    clase_id: str, 
    data: dict, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar una clase del usuario autenticado"""
    usuario_id = current_user.id
    clase = db.query(Clase).filter(Clase.id == clase_id).first()
    
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    
    # Verificar que la inscripción pertenezca al usuario
    inscripcion = db.query(InscripcionMateria).filter(
        InscripcionMateria.id == clase.inscripcion_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not inscripcion:
        raise HTTPException(status_code=403, detail="No tienes permiso para modificar esta clase")
    
    # Obtener el estado anterior de completada
    completada_anterior = clase.completada
    
    # Actualizar campos
    for key, value in data.items():
        if hasattr(clase, key) and key != "id":
            setattr(clase, key, value)
    
    # Actualizar progreso si cambió el estado de completada
    if 'completada' in data:
        if data['completada'] and not completada_anterior:
            inscripcion.progreso_clases += 1
        elif not data['completada'] and completada_anterior:
            inscripcion.progreso_clases = max(0, inscripcion.progreso_clases - 1)
    
    db.commit()
    db.refresh(clase)
    
    # VERIFICAR LOGROS después de actualizar clase
    verificar_logros_usuario(db, usuario_id)
    
    return clase

@router.delete("/clases/{clase_id}")
def eliminar_clase(
    clase_id: str, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar una clase del usuario autenticado"""
    usuario_id = current_user.id
    clase = db.query(Clase).filter(Clase.id == clase_id).first()
    
    if not clase:
        raise HTTPException(status_code=404, detail="Clase no encontrada")
    
    # Verificar que la inscripción pertenezca al usuario
    inscripcion = db.query(InscripcionMateria).filter(
        InscripcionMateria.id == clase.inscripcion_id,
        InscripcionMateria.usuario_id == usuario_id
    ).first()
    
    if not inscripcion:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta clase")
    
    # Actualizar progreso de la inscripción
    if clase.completada and inscripcion.progreso_clases > 0:
        inscripcion.progreso_clases -= 1
    
    db.delete(clase)
    db.commit()
    
    # VERIFICAR LOGROS después de eliminar clase
    verificar_logros_usuario(db, usuario_id)
    
    return {"status": "ok", "message": "Clase eliminada correctamente"}

# --- RUTAS DE PROFESORES ---

@router.get("/profesores/coleccion")
def get_coleccion(
    materia_id: Optional[str] = None,
    es_jefe_catedra: Optional[bool] = None,
    desbloqueado: Optional[bool] = None,
    db: Session = Depends(get_db)
):
    """Obtener colección de profesores con filtros"""
    query = db.query(Profesor)
    
    if materia_id:
        from app.models.models import profesores_materias
        query = query.join(
            profesores_materias, 
            Profesor.id == profesores_materias.c.profesor_id
        ).filter(profesores_materias.c.materia_id == materia_id)
    
    if es_jefe_catedra is not None:
        query = query.filter(Profesor.es_jefe_catedra == es_jefe_catedra)
    
    if desbloqueado is not None:
        query = query.filter(Profesor.desbloqueado == desbloqueado)
    
    return query.order_by(Profesor.nombre.asc(), Profesor.apellido.asc()).all()

# --- RUTAS DE FLASHCARDS ---

@router.get("/flashcards")
def list_flashcards(
    materia_id: Optional[str] = None,
    mazo_id: Optional[str] = None,
    estado: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar flashcards del usuario autenticado con filtros"""
    usuario_id = current_user.id
    query = db.query(FlashCard).options(
        joinedload(FlashCard.usuario),
        joinedload(FlashCard.materia),
        joinedload(FlashCard.mazo)
    ).filter(FlashCard.usuario_id == usuario_id)
    
    if materia_id:
        query = query.filter(FlashCard.materia_id == materia_id)
    
    if mazo_id:
        query = query.filter(FlashCard.mazo_id == mazo_id)
    
    if estado:
        query = query.filter(FlashCard.estado == estado)
    
    return query.order_by(FlashCard.proxima_revision.asc()).all()

@router.post("/flashcards")
def create_flashcard(
    data: FlashcardCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una nueva flashcard para el usuario autenticado"""
    usuario_id = current_user.id
    
    # Calcular fecha de próxima revisión
    proxima_revision = datetime.now().date()
    
    # Crear nueva flashcard
    nueva_flashcard = FlashCard(
        usuario_id=usuario_id,
        materia_id=data.materia_id,
        mazo_id=data.mazo_id,
        pregunta=data.pregunta,
        respuesta=data.respuesta,
        dificultad=data.dificultad,
        etiquetas=data.etiquetas,
        intervalo_dias=data.intervalo_dias,
        proxima_revision=proxima_revision,
        estado="activa"
    )
    
    db.add(nueva_flashcard)
    db.commit()
    db.refresh(nueva_flashcard)
    
    # Actualizar contador del mazo si existe
    if data.mazo_id:
        mazo = db.query(MazoFlashCard).filter(MazoFlashCard.id == data.mazo_id).first()
        if mazo:
            mazo.total_cards += 1
            db.commit()
    
    # VERIFICAR LOGROS después de crear flashcard
    verificar_logros_usuario(db, usuario_id)
    
    return nueva_flashcard

# --- RUTAS DE SESIONES DE ESTUDIO ---

@router.get("/sesiones")
def list_sesiones(
    materia_id: Optional[str] = None,
    fecha: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar sesiones de estudio del usuario autenticado con filtros"""
    usuario_id = current_user.id
    query = db.query(SesionEstudio).options(
        joinedload(SesionEstudio.usuario),
        joinedload(SesionEstudio.materia),
        joinedload(SesionEstudio.inscripcion)
    ).filter(SesionEstudio.usuario_id == usuario_id)
    
    if materia_id:
        query = query.filter(SesionEstudio.materia_id == materia_id)
    
    if fecha:
        query = query.filter(SesionEstudio.fecha == fecha)
    
    return query.order_by(SesionEstudio.fecha.desc(), SesionEstudio.hora_inicio.desc()).all()

@router.post("/sesiones")
def create_sesion(
    data: SesionCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una nueva sesión de estudio para el usuario autenticado"""
    usuario_id = current_user.id
    
    nueva_sesion = SesionEstudio(
        usuario_id=usuario_id,
        materia_id=data.materia_id,
        inscripcion_id=data.inscripcion_id,
        fecha=data.fecha,
        hora_inicio=data.hora_inicio,
        hora_fin=data.hora_fin,
        duracion_minutos=data.duracion_minutos,
        tipo=data.tipo,
        pomodoros_completados=data.pomodoros_completados,
        descripcion=data.descripcion,
        eficiencia=data.eficiencia,
        estado_animo=data.estado_animo,
        lugar=data.lugar,
        recursos=data.recursos
    )
    
    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)
    
    # VERIFICAR LOGROS después de crear sesión
    logros_desbloqueados = verificar_logros_usuario(db, usuario_id)
    
    return {
        "sesion": nueva_sesion,
        "logros_desbloqueados": logros_desbloqueados
    }

# --- RUTAS DE CALENDARIO ---

@router.get("/calendario/eventos")
def get_eventos_calendario(
    fecha_inicio: Optional[date] = None,
    fecha_fin: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener eventos para el calendario del usuario autenticado"""
    usuario_id = current_user.id
    
    # Obtener notas (exámenes)
    query_notas = db.query(Nota).filter(Nota.usuario_id == usuario_id)
    
    # Obtener clases checkpoint
    query_clases = db.query(Clase).join(
        InscripcionMateria, Clase.inscripcion_id == InscripcionMateria.id
    ).filter(
        InscripcionMateria.usuario_id == usuario_id,
        Clase.es_checkpoint == True
    )
    
    # Obtener eventos de planificación
    query_eventos = db.query(EventoPlanificacion).filter(
        EventoPlanificacion.usuario_id == usuario_id
    )
    
    # Aplicar filtros de fecha si se proporcionan
    if fecha_inicio:
        query_notas = query_notas.filter(Nota.fecha >= fecha_inicio)
        query_clases = query_clases.filter(Clase.fecha >= fecha_inicio)
        query_eventos = query_eventos.filter(EventoPlanificacion.fecha >= fecha_inicio)
    
    if fecha_fin:
        query_notas = query_notas.filter(Nota.fecha <= fecha_fin)
        query_clases = query_clases.filter(Clase.fecha <= fecha_fin)
        query_eventos = query_eventos.filter(EventoPlanificacion.fecha <= fecha_fin)
    
    notas = query_notas.all()
    clases = query_clases.all()
    eventos = query_eventos.all()
    
    # Formatear eventos de notas
    ev_notas = [
        {
            "id": f"nota_{n.id}",
            "fecha": n.fecha,
            "tipo": "examen",
            "titulo": n.titulo,
            "materia_id": n.materia_id,
            "color": "#ef4444"  # Rojo para exámenes
        } for n in notas
    ]
    
    # Formatear eventos de clases checkpoint
    ev_clases = [
        {
            "id": f"clase_{c.id}",
            "fecha": c.fecha,
            "tipo": "checkpoint",
            "titulo": c.titulo,
            "materia_id": c.inscripcion.materia_id if c.inscripcion else None,
            "color": "#3b82f6"  # Azul para checkpoints
        } for c in clases
    ]
    
    # Formatear eventos de planificación
    ev_planificacion = [
        {
            "id": f"evento_{e.id}",
            "fecha": e.fecha,
            "tipo": e.tipo,
            "titulo": e.titulo,
            "materia_id": e.materia_id,
            "color": e.color,
            "hora_inicio": e.hora_inicio,
            "hora_fin": e.hora_fin
        } for e in eventos
    ]
    
    return ev_notas + ev_clases + ev_planificacion

# --- RUTAS DE PLANIFICACIÓN ---

@router.get("/planificacion/eventos")
def listar_eventos(
    materia_id: Optional[str] = None,
    tipo: Optional[str] = None,
    completado: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar eventos de planificación del usuario autenticado"""
    usuario_id = current_user.id
    query = db.query(EventoPlanificacion).options(
        joinedload(EventoPlanificacion.usuario),
        joinedload(EventoPlanificacion.materia)
    ).filter(EventoPlanificacion.usuario_id == usuario_id)
    
    if materia_id:
        query = query.filter(EventoPlanificacion.materia_id == materia_id)
    
    if tipo:
        query = query.filter(EventoPlanificacion.tipo == tipo)
    
    if completado is not None:
        query = query.filter(EventoPlanificacion.completado == completado)
    
    return query.order_by(EventoPlanificacion.fecha.asc(), EventoPlanificacion.hora_inicio.asc()).all()

@router.post("/planificacion/eventos")
def crear_evento(
    evento_data: EventoCreate, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear un nuevo evento de planificación para el usuario autenticado"""
    usuario_id = current_user.id
    
    # Crear el evento
    nuevo_evento = EventoPlanificacion(
        usuario_id=usuario_id,
        titulo=evento_data.titulo,
        descripcion=evento_data.descripcion,
        fecha=evento_data.fecha,
        hora_inicio=evento_data.hora_inicio,
        hora_fin=evento_data.hora_fin,
        tipo=evento_data.tipo,
        materia_id=evento_data.materia_id,
        color=evento_data.color,
        prioridad=evento_data.prioridad,
        completado=evento_data.completado
    )
    
    db.add(nuevo_evento)
    
    # Si es un examen o TP, crear la "Nota Vacía" (-1) si hay materia asociada
    if evento_data.tipo in ["parcial", "tp", "final"] and evento_data.materia_id:
        # Buscar inscripción activa para esa materia y usuario
        inscripcion = db.query(InscripcionMateria).filter(
            InscripcionMateria.usuario_id == usuario_id,
            InscripcionMateria.materia_id == evento_data.materia_id,
            InscripcionMateria.estado.in_(['cursando', 'regular'])
        ).first()
        
        if inscripcion:
            nota_id = f"nota_{uuid.uuid4().hex[:10]}"
            
            # Determinar tipo de evaluación
            tipo_evaluacion = evento_data.tipo
            if evento_data.tipo == "parcial":
                es_parcial = True
                es_final = False
                es_tp = False
            elif evento_data.tipo == "final":
                es_parcial = False
                es_final = True
                es_tp = False
            else:  # tp
                es_parcial = False
                es_final = False
                es_tp = True
            
            nueva_nota = Nota(
                id=nota_id,
                inscripcion_id=inscripcion.id,
                usuario_id=usuario_id,
                materia_id=evento_data.materia_id,
                tipo_evaluacion=tipo_evaluacion,
                titulo=f"{evento_data.tipo.upper()}: {evento_data.titulo}",
                nota=-1.0,  # VALOR CENTINELA para el dashboard
                fecha=evento_data.fecha,
                es_parcial=es_parcial,
                es_final=es_final,
                es_tp=es_tp,
                influye_promedio=False  # No influye hasta tener nota real
            )
            
            db.add(nueva_nota)
    
    db.commit()
    db.refresh(nuevo_evento)
    
    # VERIFICAR LOGROS después de crear evento
    verificar_logros_usuario(db, usuario_id)
    
    return {
        "message": "Evento y planificación creados con éxito",
        "evento": nuevo_evento
    }

@router.delete("/planificacion/eventos/{evento_id}")
def eliminar_evento(
    evento_id: int, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Eliminar un evento de planificación del usuario autenticado"""
    usuario_id = current_user.id
    evento = db.query(EventoPlanificacion).filter(
        EventoPlanificacion.id == evento_id,
        EventoPlanificacion.usuario_id == usuario_id
    ).first()
    
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    db.delete(evento)
    db.commit()
    
    # VERIFICAR LOGROS después de eliminar evento
    verificar_logros_usuario(db, usuario_id)
    
    return {"status": "ok", "message": "Evento eliminada correctamente"}

@router.patch("/planificacion/eventos/{evento_id}")
def actualizar_evento(
    evento_id: int, 
    data: dict, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Actualizar un evento de planificación del usuario autenticado"""
    usuario_id = current_user.id
    evento = db.query(EventoPlanificacion).filter(
        EventoPlanificacion.id == evento_id,
        EventoPlanificacion.usuario_id == usuario_id
    ).first()
    
    if not evento:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    
    # Campos permitidos
    allowed_fields = [
        'titulo', 'descripcion', 'fecha', 'hora_inicio', 'hora_fin',
        'tipo', 'materia_id', 'color', 'prioridad', 'completado'
    ]
    
    for key, value in data.items():
        if hasattr(evento, key) and key in allowed_fields:
            # Manejar conversión de fechas
            if key == 'fecha' and isinstance(value, str):
                value = datetime.strptime(value, "%Y-%m-%d").date()
            setattr(evento, key, value)
    
    db.commit()
    db.refresh(evento)
    
    # VERIFICAR LOGROS después de actualizar evento
    verificar_logros_usuario(db, usuario_id)
    
    return {"message": "Evento actualizado", "evento": evento}

# --- RUTAS DE LOGROS ---

@router.get("/logros")
def listar_logros(
    categoria_id: Optional[str] = None,
    desbloqueado: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener todos los logros con estado del usuario autenticado"""
    usuario_id = current_user.id
    query = db.query(Logro).options(joinedload(Logro.categoria))
    
    if categoria_id:
        query = query.filter(Logro.categoria_id == categoria_id)
    
    if desbloqueado is not None:
        query = query.filter(Logro.desbloqueado == desbloqueado)
    
    logros = query.order_by(Logro.categoria_id, Logro.puntos.desc()).all()
    
    # Verificar cuáles están desbloqueados para este usuario
    logros_desbloqueados = db.query(LogroDesbloqueado.logro_id).filter(
        LogroDesbloqueado.usuario_id == usuario_id
    ).all()
    logros_desbloqueados_ids = [ld[0] for ld in logros_desbloqueados]
    
    resultado = []
    for logro in logros:
        logro_dict = {
            "id": logro.id,
            "nombre": logro.nombre,
            "descripcion": logro.descripcion,
            "icono": logro.icono,
            "categoria": logro.categoria.nombre if logro.categoria else None,
            "rareza": logro.rareza,
            "puntos": logro.puntos,
            "desbloqueado": logro.id in logros_desbloqueados_ids,
            "fecha_desbloqueo": None,
            "progreso_actual": 0,
            "progreso_requerido": logro.progreso_requerido
        }
        
        # Obtener fecha de desbloqueo si está desbloqueado
        if logro.id in logros_desbloqueados_ids:
            desbloqueo = db.query(LogroDesbloqueado).filter(
                LogroDesbloqueado.logro_id == logro.id,
                LogroDesbloqueado.usuario_id == usuario_id
            ).first()
            if desbloqueo:
                logro_dict["fecha_desbloqueo"] = desbloqueo.fecha_desbloqueo
        
        # Obtener progreso si existe
        progreso = db.query(LogroProgreso).filter(
            LogroProgreso.logro_id == logro.id,
            LogroProgreso.usuario_id == usuario_id
        ).first()
        
        if progreso:
            logro_dict["progreso_actual"] = progreso.progreso_actual
            logro_dict["completado"] = progreso.completado
        
        resultado.append(logro_dict)
    
    return resultado

@router.get("/logros/{logro_id}")
def obtener_logro(
    logro_id: str, 
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener un logro específico con estado del usuario autenticado"""
    usuario_id = current_user.id
    logro = db.query(Logro).options(joinedload(Logro.categoria)).filter(Logro.id == logro_id).first()
    
    if not logro:
        raise HTTPException(status_code=404, detail="Logro no encontrado")
    
    # Verificar si está desbloqueado
    desbloqueado = db.query(LogroDesbloqueado).filter(
        LogroDesbloqueado.logro_id == logro_id,
        LogroDesbloqueado.usuario_id == usuario_id
    ).first()
    
    # Obtener progreso
    progreso = db.query(LogroProgreso).filter(
        LogroProgreso.logro_id == logro_id,
        LogroProgreso.usuario_id == usuario_id
    ).first()
    
    return {
        "logro": logro,
        "desbloqueado": desbloqueado is not None,
        "fecha_desbloqueo": desbloqueado.fecha_desbloqueo if desbloqueado else None,
        "progreso": {
            "actual": progreso.progreso_actual if progreso else 0,
            "requerido": logro.progreso_requerido,
            "completado": progreso.completado if progreso else False
        } if progreso else None
    }

@router.get("/insignias")
def list_insignias(db: Session = Depends(get_db)):
    """Mantener compatibilidad temporal para el frontend"""
    return {
        "message": "Esta ruta está obsoleta. Usa /api/logros en su lugar.",
        "logros": db.query(Logro).all()
    }

@router.get("/categorias-logros")
def list_categorias_logros(db: Session = Depends(get_db)):
    """Listar todas las categorías de logros"""
    return db.query(CategoriaLogro).order_by(CategoriaLogro.orden).all()

# --- ENDPOINT ESPECIAL PARA FORZAR VERIFICACIÓN DE LOGROS ---

@router.post("/verificar-logros")
def verificar_logros(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Forzar la verificación de logros para el usuario autenticado"""
    usuario_id = current_user.id
    
    try:
        logros_desbloqueados = LogroService.verificar_y_desbloquear_logros(db, usuario_id)
        
        return {
            "status": "ok",
            "message": f"Verificación de logros completada",
            "logros_desbloqueados": logros_desbloqueados,
            "total_nuevos": len(logros_desbloqueados)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verificando logros: {str(e)}")

# --- RUTAS DE CARRERAS ---

@router.get("/carreras")
def list_carreras(db: Session = Depends(get_db)):
    """Listar todas las carreras activas para el registro"""
    return db.query(Carrera).filter(Carrera.activa == True).all()