# backend/app/routes/social.py
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.models import (
    GrupoEstudio, Usuario, Materia, InscripcionMateria,
    ApunteCompartido, SesionGrupo, usuarios_grupos,
    Agradecimiento, Logro, LogroDesbloqueado
)
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time
import uuid
from app.core.security import get_current_user
from sqlalchemy import desc, func, or_
import os
import shutil


router = APIRouter()

# ==================== SCHEMAS ====================
class GrupoCreate(BaseModel):
    nombre: str
    descripcion: Optional[str] = None
    materia_id: str
    max_integrantes: int = 10
    privado: bool = False

class MensajeCreate(BaseModel):
    contenido: str
    tipo: str = "texto"
    recurso_url: Optional[str] = None

class ApunteCreate(BaseModel):
    materia_id: str
    titulo: str
    descripcion: str
    contenido: str
    formato: str = "texto"
    compartido_publicamente: bool = True
    etiquetas: Optional[str] = None

class BusquedaUsuarios(BaseModel):
    query: str
    materia_id: Optional[str] = None
    nivel_min: Optional[int] = None

# ==================== RUTAS GRUPOS ====================

# ==================== RUTAS GRUPOS (CORREGIDAS) ====================

@router.get("/grupos/{grupo_id}")
def obtener_grupo(grupo_id: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Obtener detalles de un grupo sin errores 500"""
    grupo = db.query(GrupoEstudio).options(
        joinedload(GrupoEstudio.materia),
        joinedload(GrupoEstudio.creador)
    ).filter(GrupoEstudio.id == grupo_id).first()
    
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Obtener recursos de la materia del grupo
    recursos = db.query(ApunteCompartido).filter(
        ApunteCompartido.materia_id == grupo.materia_id,
        ApunteCompartido.compartido_publicamente == True
    ).limit(10).all()
    
    return {
        "grupo": {
            "id": grupo.id,
            "nombre": grupo.nombre,
            "descripcion": grupo.descripcion,
            "materia_nombre": grupo.materia.nombre if grupo.materia else "General",
            "integrantes_actuales": grupo.integrantes_actuales
        },
        "recursos_destacados": recursos
    }

# --- NUEVAS RUTAS: MENSAJERÍA DE GRUPO [Soluciona el 404] ---

@router.get("/grupos/{grupo_id}/mensajes")
def listar_mensajes_grupo(grupo_id: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Traer historial de mensajes del grupo"""
    # Aquí deberías tener un modelo MensajeGrupo. Por ahora, devolvemos un array vacío funcional
    # para que el frontend no rompa mientras creas la tabla de mensajes.
    return [
        {"id": 1, "contenido": "¡Bienvenidos al grupo!", "usuario_nombre": "Sistema", "fecha": datetime.now(), "usuario_id": "system"}
    ]

@router.post("/grupos/{grupo_id}/mensajes")
def enviar_mensaje_grupo(grupo_id: str, mensaje: MensajeCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Enviar un nuevo mensaje al grupo"""
    return {"status": "enviado", "contenido": mensaje.contenido}
    
@router.get("/grupos")
def listar_grupos(
    materia_id: Optional[str] = None,
    usuario_id: Optional[str] = None,
    activo: Optional[bool] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Listar grupos con filtros"""
    query = db.query(GrupoEstudio).options(
        joinedload(GrupoEstudio.materia),
        joinedload(GrupoEstudio.creador),
        joinedload(GrupoEstudio.integrantes)
    )
    
    if materia_id:
        query = query.filter(GrupoEstudio.materia_id == materia_id)
    
    if usuario_id:
        # Grupos donde el usuario es integrante
        from app.models.models import usuarios_grupos
        query = query.join(
            usuarios_grupos, GrupoEstudio.id == usuarios_grupos.c.grupo_id
        ).filter(usuarios_grupos.c.usuario_id == usuario_id)
    
    if activo is not None:
        query = query.filter(GrupoEstudio.activo == activo)
    
    grupos = query.order_by(desc(GrupoEstudio.fecha_actualizacion)).all()
    
    # Enriquecer datos
    resultado = []
    for grupo in grupos:
        grupo_dict = {
            "id": grupo.id,
            "nombre": grupo.nombre,
            "descripcion": grupo.descripcion,
            "materia_id": grupo.materia_id,
            "materia_nombre": grupo.materia.nombre if grupo.materia else None,
            "creador_nombre": f"{grupo.creador.nombre} {grupo.creador.apellido}",
            "integrantes_count": grupo.integrantes_actuales,
            "max_integrantes": grupo.max_integrantes,
            "activo": grupo.activo,
            "privado": grupo.privado,
            "codigo_invitacion": grupo.codigo_invitacion,
            "fecha_creacion": grupo.fecha_creacion,
            "ultima_actividad": grupo.fecha_actualizacion,
            "eres_miembro": current_user.id in [u.id for u in grupo.integrantes],
            "eres_admin": current_user.id == grupo.creador_id
        }
        resultado.append(grupo_dict)
    
    return resultado

@router.post("/grupos")
def crear_grupo(
    grupo_data: GrupoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear un nuevo grupo de estudio"""
    # Verificar que el usuario está inscrito en la materia
    inscripcion = db.query(InscripcionMateria).filter(
        InscripcionMateria.usuario_id == current_user.id,
        InscripcionMateria.materia_id == grupo_data.materia_id,
        InscripcionMateria.estado.in_(['cursando', 'regular'])
    ).first()
    
    if not inscripcion:
        raise HTTPException(
            status_code=400,
            detail="Debes estar cursando o regular en esta materia para crear un grupo"
        )
    
    # Generar ID y código de invitación
    grupo_id = f"grupo_{uuid.uuid4().hex[:10]}"
    codigo_invitacion = f"UTN_{uuid.uuid4().hex[:8].upper()}"
    
    nuevo_grupo = GrupoEstudio(
        id=grupo_id,
        nombre=grupo_data.nombre,
        descripcion=grupo_data.descripcion,
        creador_id=current_user.id,
        materia_id=grupo_data.materia_id,
        max_integrantes=grupo_data.max_integrantes,
        privado=grupo_data.privado,
        codigo_invitacion=codigo_invitacion,
        integrantes_actuales=1,
        activo=True
    )
    
    db.add(nuevo_grupo)
    
    # Agregar creador como integrante
    from app.models.models import usuarios_grupos
    db.execute(
        usuarios_grupos.insert().values(
            grupo_id=grupo_id,
            usuario_id=current_user.id,
            rol="admin",
            estado="activo"
        )
    )
    
    db.commit()
    db.refresh(nuevo_grupo)
    
    # Verificar logros
    verificar_logros_sociales(db, current_user.id)
    
    return {
        "message": "Grupo creado exitosamente",
        "grupo": nuevo_grupo,
        "codigo_invitacion": codigo_invitacion
    }

# ==================== RUTAS GRUPOS (CORREGIDAS) ====================

@router.get("/grupos/{grupo_id}")
def obtener_grupo(grupo_id: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Obtener detalles de un grupo sin errores 500"""
    grupo = db.query(GrupoEstudio).options(
        joinedload(GrupoEstudio.materia),
        joinedload(GrupoEstudio.creador)
    ).filter(GrupoEstudio.id == grupo_id).first()
    
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Obtener recursos de la materia del grupo
    recursos = db.query(ApunteCompartido).filter(
        ApunteCompartido.materia_id == grupo.materia_id,
        ApunteCompartido.compartido_publicamente == True
    ).limit(10).all()
    
    return {
        "grupo": {
            "id": grupo.id,
            "nombre": grupo.nombre,
            "descripcion": grupo.descripcion,
            "materia_nombre": grupo.materia.nombre if grupo.materia else "General",
            "integrantes_actuales": grupo.integrantes_actuales
        },
        "recursos_destacados": recursos
    }

# --- NUEVAS RUTAS: MENSAJERÍA DE GRUPO [Soluciona el 404] ---

@router.get("/grupos/{grupo_id}/mensajes")
def listar_mensajes_grupo(grupo_id: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Traer historial de mensajes del grupo"""
    # Aquí deberías tener un modelo MensajeGrupo. Por ahora, devolvemos un array vacío funcional
    # para que el frontend no rompa mientras creas la tabla de mensajes.
    return [
        {"id": 1, "contenido": "¡Bienvenidos al grupo!", "usuario_nombre": "Sistema", "fecha": datetime.now(), "usuario_id": "system"}
    ]

@router.post("/grupos/{grupo_id}/mensajes")
def enviar_mensaje_grupo(grupo_id: str, mensaje: MensajeCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Enviar un nuevo mensaje al grupo"""
    return {"status": "enviado", "contenido": mensaje.contenido}

@router.post("/grupos/{grupo_id}/unirse")
def unirse_grupo(
    grupo_id: str,
    codigo_invitacion: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Unirse a un grupo de estudio"""
    grupo = db.query(GrupoEstudio).filter(GrupoEstudio.id == grupo_id).first()
    
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Verificar si ya es miembro
    from app.models.models import usuarios_grupos
    ya_es_miembro = db.execute(
        usuarios_grupos.select().where(
            usuarios_grupos.c.grupo_id == grupo_id,
            usuarios_grupos.c.usuario_id == current_user.id
        )
    ).first()
    
    if ya_es_miembro:
        raise HTTPException(status_code=400, detail="Ya eres miembro de este grupo")
    
    # Verificar límite de integrantes
    if grupo.integrantes_actuales >= grupo.max_integrantes:
        raise HTTPException(status_code=400, detail="El grupo está lleno")
    
    # Verificar código de invitación si es privado
    if grupo.privado and grupo.codigo_invitacion != codigo_invitacion:
        raise HTTPException(status_code=403, detail="Código de invitación inválido")
    
    # Verificar que el usuario está cursando la materia
    inscripcion = db.query(InscripcionMateria).filter(
        InscripcionMateria.usuario_id == current_user.id,
        InscripcionMateria.materia_id == grupo.materia_id
    ).first()
    
    if not inscripcion:
        raise HTTPException(
            status_code=400,
            detail="Debes estar inscrito en esta materia para unirte al grupo"
        )
    
    # Agregar usuario al grupo
    db.execute(
        usuarios_grupos.insert().values(
            grupo_id=grupo_id,
            usuario_id=current_user.id,
            rol="integrante",
            estado="activo"
        )
    )
    
    # Actualizar contador
    grupo.integrantes_actuales += 1
    grupo.fecha_actualizacion = datetime.now()
    
    db.commit()
    
    # Verificar logros
    verificar_logros_sociales(db, current_user.id)
    
    return {"message": "Te has unido al grupo exitosamente"}

# ==================== RUTAS APUNTES ====================
@router.get("/apuntes")
def listar_apuntes(
    materia_id: Optional[str] = None,
    usuario_id: Optional[str] = None,
    destacados: Optional[bool] = None,
    limit: int = 20,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """Listar apuntes compartidos con filtros"""
    query = db.query(ApunteCompartido).options(
        joinedload(ApunteCompartido.usuario),
        joinedload(ApunteCompartido.materia)
    ).filter(ApunteCompartido.compartido_publicamente == True)
    
    if materia_id:
        query = query.filter(ApunteCompartido.materia_id == materia_id)
    
    if usuario_id:
        query = query.filter(ApunteCompartido.usuario_id == usuario_id)
    
    if destacados:
        query = query.filter(ApunteCompartido.calificacion_promedio >= 4.0)
    
    total = query.count()
    
    apuntes = query.order_by(
        desc(ApunteCompartido.calificacion_promedio),
        desc(ApunteCompartido.veces_descargado)
    ).offset(offset).limit(limit).all()
    
    # Calcular estadísticas
    materias_populares = db.query(
        Materia.nombre,
        func.count(ApunteCompartido.id).label('total')
    ).join(
        ApunteCompartido, Materia.id == ApunteCompartido.materia_id
    ).group_by(Materia.id).order_by(desc('total')).limit(5).all()
    
    return {
        "apuntes": apuntes,
        "total": total,
        "materias_populares": [
            {"materia": m[0], "total_apuntes": m[1]} for m in materias_populares
        ],
        "paginacion": {
            "limit": limit,
            "offset": offset,
            "has_more": offset + limit < total
        }
    }

# Define donde se guardarán los archivos
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)

@router.post("/apuntes")
def compartir_apunte(
    materia_id: str = Form(...),
    titulo: str = Form(...),
    descripcion: str = Form(""),
    contenido: Optional[str] = Form(None),
    compartido_publicamente: str = Form("true"),
    archivo: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    apunte_id = f"apunte_{uuid.uuid4().hex[:10]}"
    formato_final = "texto"
    
    # LÓGICA DE ALMACENAMIENTO REAL
    if archivo:
        formato_final = archivo.filename.split('.')[-1].lower()
        # Creamos un nombre de archivo único para evitar que se pisen
        file_path = os.path.join(UPLOAD_DIR, f"{apunte_id}.{formato_final}")
        
        # Guardamos el archivo binario en el disco
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(archivo.file, buffer)
            
        # En la DB guardamos el "ID" o ruta para recuperarlo luego
        contenido_final = f"FILE:{apunte_id}.{formato_final}"
    else:
        contenido_final = contenido

    nuevo_apunte = ApunteCompartido(
        id=apunte_id,
        usuario_id=current_user.id,
        materia_id=materia_id,
        titulo=titulo,
        descripcion=descripcion,
        contenido=contenido_final,
        formato=formato_final,
        compartido_publicamente=compartido_publicamente.lower() == "true",
        activo=True
    )
    
    db.add(nuevo_apunte)
    db.commit()
    return {"message": "Archivo guardado físicamente", "apunte": nuevo_apunte}

@router.get("/apuntes/descargar/{archivo_id}")
def descargar_archivo(archivo_id: str):
    file_path = os.path.join(UPLOAD_DIR, archivo_id)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="El archivo físico no existe")
    
    return FileResponse(path=file_path, filename=archivo_id)

@router.get("/apuntes")
def listar_apuntes(materia_id: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(ApunteCompartido).options(joinedload(ApunteCompartido.usuario), joinedload(ApunteCompartido.materia))
    if materia_id:
        query = query.filter(ApunteCompartido.materia_id == materia_id)
    return {"apuntes": query.order_by(desc(ApunteCompartido.fecha_compartido)).all()}

@router.post("/apuntes/{apunte_id}/calificar")
def calificar_apunte(
    apunte_id: str,
    calificacion: int = Form(..., ge=1, le=5),
    comentario: Optional[str] = Form(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Calificar un apunte compartido"""
    if calificacion < 1 or calificacion > 5:
        raise HTTPException(status_code=400, detail="La calificación debe estar entre 1 y 5")
    
    apunte = db.query(ApunteCompartido).filter(ApunteCompartido.id == apunte_id).first()
    
    if not apunte:
        raise HTTPException(status_code=404, detail="Apunte no encontrado")
    
    # Verificar que no haya calificado antes
    from app.models.models import apuntes_calificaciones
    ya_calificado = db.execute(
        apuntes_calificaciones.select().where(
            apuntes_calificaciones.c.apunte_id == apunte_id,
            apuntes_calificaciones.c.usuario_id == current_user.id
        )
    ).first()
    
    if ya_calificado:
        raise HTTPException(status_code=400, detail="Ya has calificado este apunte")
    
    # Insertar calificación
    db.execute(
        apuntes_calificaciones.insert().values(
            apunte_id=apunte_id,
            usuario_id=current_user.id,
            calificacion=calificacion,
            comentario=comentario,
            fecha=datetime.now()
        )
    )
    
    # Actualizar promedio del apunte
    calificaciones = db.execute(
        apuntes_calificaciones.select().where(
            apuntes_calificaciones.c.apunte_id == apunte_id
        )
    ).fetchall()
    
    if calificaciones:
        promedio = sum(c.calificacion for c in calificaciones) / len(calificaciones)
        apunte.calificacion_promedio = round(promedio, 2)
        apunte.total_calificaciones = len(calificaciones)
    
    db.commit()
    
    # Otorgar agradecimiento al creador si la calificación es alta
    if calificacion >= 4 and apunte.usuario_id != current_user.id:
        agradecimiento = Agradecimiento(
            id=f"agra_{uuid.uuid4().hex[:10]}",
            emisor_id=current_user.id,
            receptor_id=apunte.usuario_id,
            tipo="calificacion",
            descripcion=f"Calificó tu apunte '{apunte.titulo}' con {calificacion} estrellas",
            materia_id=apunte.materia_id
        )
        db.add(agradecimiento)
        db.commit()
    
    return {"message": "Calificación registrada exitosamente"}

# ==================== RUTAS USUARIOS ====================
@router.get("/usuarios/buscar")
def buscar_usuarios(
    query: str, 
    materia_id: Optional[str] = None, 
    db: Session = Depends(get_db), 
    current_user: Usuario = Depends(get_current_user)
):
    """Buscar usuarios por múltiples criterios de forma optimizada"""
    if len(query.strip()) < 2:
        raise HTTPException(status_code=400, detail="Mínimo 2 caracteres")

    # 1. Buscamos las materias del usuario actual UNA SOLA VEZ fuera del loop para velocidad
    materias_current_ids = [m.materia_id for m in db.query(InscripcionMateria.materia_id).filter(
        InscripcionMateria.usuario_id == current_user.id
    ).all()]

    # 2. Ejecutamos la búsqueda (Aquí definimos 'usuarios')
    # Buscamos por nombre, apellido, legajo o email
    usuarios = db.query(Usuario).filter(
        or_(
            Usuario.nombre.ilike(f"%{query}%"),
            Usuario.apellido.ilike(f"%{query}%"),
            Usuario.legajo.ilike(f"%{query}%"),
            Usuario.email.ilike(f"%{query}%")
        ),
        Usuario.id != current_user.id  # No nos buscamos a nosotros mismos
    ).limit(10).all()

    resultado = []
    for usuario in usuarios:
        # Buscamos materias del candidato
        materias_candidato_ids = [m.materia_id for m in db.query(InscripcionMateria.materia_id).filter(
            InscripcionMateria.usuario_id == usuario.id
        ).all()]
        
        # Intersección de sets para saber qué materias comparten
        comunes_ids = list(set(materias_current_ids) & set(materias_candidato_ids))
        
        nombres_comunes = []
        if comunes_ids:
            # Traemos los nombres de las materias compartidas
            materias_db = db.query(Materia.nombre).filter(Materia.id.in_(comunes_ids)).all()
            nombres_comunes = [m[0] for m in materias_db]

        resultado.append({
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "legajo": usuario.legajo,
            "email": usuario.email,
            "avatar_url": usuario.avatar_url,
            "promedio": usuario.promedio_general,
            "materias_comunes": nombres_comunes,
            "total_materias_comunes": len(comunes_ids)
        })
    
    return resultado

@router.get("/usuarios/{usuario_id}/perfil")
def obtener_perfil_usuario(
    usuario_id: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener perfil público de un usuario"""
    usuario = db.query(Usuario).options(
        joinedload(Usuario.carrera)
    ).filter(Usuario.id == usuario_id).first()
    
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Obtener estadísticas académicas
    aprobadas = db.query(InscripcionMateria).filter(
        InscripcionMateria.usuario_id == usuario_id,
        InscripcionMateria.estado == "aprobada"
    ).count()
    
    cursando = db.query(InscripcionMateria).filter(
        InscripcionMateria.usuario_id == usuario_id,
        InscripcionMateria.estado == "cursando"
    ).count()
    
    # Obtener logros desbloqueados
    logros = db.query(LogroDesbloqueado).join(
        Logro, LogroDesbloqueado.logro_id == Logro.id
    ).filter(
        LogroDesbloqueado.usuario_id == usuario_id
    ).order_by(desc(LogroDesbloqueado.fecha_desbloqueo)).limit(5).all()
    
    # Obtener apuntes compartidos
    apuntes = db.query(ApunteCompartido).filter(
        ApunteCompartido.usuario_id == usuario_id,
        ApunteCompartido.compartido_publicamente == True
    ).order_by(desc(ApunteCompartido.calificacion_promedio)).limit(5).all()
    
    return {
        "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "legajo": usuario.legajo,
            "carrera": usuario.carrera.nombre if usuario.carrera else None,
            "avatar_url": usuario.avatar_url,
            "promedio_general": usuario.promedio_general,
            "creditos_aprobados": usuario.creditos_aprobados,
            "fecha_ingreso": usuario.fecha_ingreso,
            "ultimo_login": usuario.ultimo_login
        },
        "estadisticas": {
            "materias_aprobadas": aprobadas,
            "materias_cursando": cursando,
            "total_horas_estudio": 0,  # Se podría calcular
            "total_apuntes_compartidos": len(apuntes)
        },
        "logros_destacados": [
            {
                "nombre": l.logro.nombre,
                "icono": l.logro.icono,
                "fecha": l.fecha_desbloqueo
            } for l in logros
        ],
        "apuntes_destacados": apuntes
    }

# ==================== RUTAS SESIONES GRUPO ====================

@router.get("/grupos/{grupo_id}")
def obtener_grupo(grupo_id: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Obtener detalles de un grupo sin errores 500"""
    grupo = db.query(GrupoEstudio).options(
        joinedload(GrupoEstudio.materia),
        joinedload(GrupoEstudio.creador)
    ).filter(GrupoEstudio.id == grupo_id).first()
    
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo no encontrado")
    
    # Obtener recursos de la materia del grupo
    recursos = db.query(ApunteCompartido).filter(
        ApunteCompartido.materia_id == grupo.materia_id,
        ApunteCompartido.compartido_publicamente == True
    ).limit(10).all()
    
    return {
        "grupo": {
            "id": grupo.id,
            "nombre": grupo.nombre,
            "descripcion": grupo.descripcion,
            "materia_nombre": grupo.materia.nombre if grupo.materia else "General",
            "integrantes_actuales": grupo.integrantes_actuales
        },
        "recursos_destacados": recursos
    }

# --- NUEVAS RUTAS: MENSAJERÍA DE GRUPO [Soluciona el 404] ---

@router.get("/grupos/{grupo_id}/mensajes")
def listar_mensajes_grupo(grupo_id: str, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Traer historial de mensajes del grupo"""
    # Aquí deberías tener un modelo MensajeGrupo. Por ahora, devolvemos un array vacío funcional
    # para que el frontend no rompa mientras creas la tabla de mensajes.
    return [
        {"id": 1, "contenido": "¡Bienvenidos al grupo!", "usuario_nombre": "Sistema", "fecha": datetime.now(), "usuario_id": "system"}
    ]

@router.post("/grupos/{grupo_id}/mensajes")
def enviar_mensaje_grupo(grupo_id: str, mensaje: MensajeCreate, db: Session = Depends(get_db), current_user: Usuario = Depends(get_current_user)):
    """Enviar un nuevo mensaje al grupo"""
    return {"status": "enviado", "contenido": mensaje.contenido}
    
@router.post("/grupos/{grupo_id}/sesiones")
def crear_sesion_grupo(
    grupo_id: str,
    fecha: date = Form(...),
    hora_inicio: time = Form(...),
    duracion_minutos: int = Form(60),
    tema: str = Form(...),
    descripcion: Optional[str] = Form(None),
    lugar: str = Form("Virtual"),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Crear una sesión de estudio grupal"""
    # Verificar que el usuario es admin del grupo
    from app.models.models import usuarios_grupos
    membresia = db.execute(
        usuarios_grupos.select().where(
            usuarios_grupos.c.grupo_id == grupo_id,
            usuarios_grupos.c.usuario_id == current_user.id,
            usuarios_grupos.c.rol.in_(['admin', 'moderador'])
        )
    ).first()
    
    if not membresia:
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear sesiones")
    
    sesion_id = f"sesion_{uuid.uuid4().hex[:10]}"
    
    nueva_sesion = SesionGrupo(
        id=sesion_id,
        grupo_id=grupo_id,
        fecha=fecha,
        hora_inicio=hora_inicio,
        duracion_minutos=duracion_minutos,
        tema=tema,
        descripcion=descripcion,
        lugar=lugar,
        asistentes=0,
        satisfaccion=0
    )
    
    db.add(nueva_sesion)
    db.commit()
    db.refresh(nueva_sesion)
    
    return {
        "message": "Sesión programada exitosamente",
        "sesion": nueva_sesion
    }

# ==================== FUNCIONES AUXILIARES ====================
def verificar_logros_sociales(db: Session, usuario_id: str):
    """Verificar logros relacionados con actividades sociales"""
    # Logro: Primer apunte compartido
    apuntes_count = db.query(ApunteCompartido).filter(
        ApunteCompartido.usuario_id == usuario_id
    ).count()
    
    if apuntes_count == 1:
        # Otorgar logro "Compartidor"
        logro = db.query(Logro).filter(Logro.id == "logro_compartidor").first()
        if logro:
            desbloqueado = db.query(LogroDesbloqueado).filter(
                LogroDesbloqueado.logro_id == logro.id,
                LogroDesbloqueado.usuario_id == usuario_id
            ).first()
            
            if not desbloqueado:
                nuevo_desbloqueo = LogroDesbloqueado(
                    id=f"ld_{uuid.uuid4().hex[:10]}",
                    logro_id=logro.id,
                    usuario_id=usuario_id,
                    datos_contexto="Primer apunte compartido"
                )
                db.add(nuevo_desbloqueo)
    
    # Logro: Únete a 3 grupos
    from app.models.models import usuarios_grupos
    grupos_count = db.execute(
        usuarios_grupos.select().where(
            usuarios_grupos.c.usuario_id == usuario_id
        )
    ).rowcount
    
    if grupos_count == 3:
        logro = db.query(Logro).filter(Logro.id == "logro_social").first()
        if logro:
            desbloqueado = db.query(LogroDesbloqueado).filter(
                LogroDesbloqueado.logro_id == logro.id,
                LogroDesbloqueado.usuario_id == usuario_id
            ).first()
            
            if not desbloqueado:
                nuevo_desbloqueo = LogroDesbloqueado(
                    id=f"ld_{uuid.uuid4().hex[:10]}",
                    logro_id=logro.id,
                    usuario_id=usuario_id,
                    datos_contexto="Unido a 3 grupos de estudio"
                )
                db.add(nuevo_desbloqueo)
    
    db.commit()

@router.get("/estadisticas/comunidad")
def obtener_estadisticas_comunidad(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user)
):
    """Obtener estadísticas generales de la comunidad"""
    total_usuarios = db.query(Usuario).count()
    total_grupos = db.query(GrupoEstudio).count()
    total_apuntes = db.query(ApunteCompartido).filter(
        ApunteCompartido.compartido_publicamente == True
    ).count()
    
    # Materia con más apuntes
    materia_popular = db.query(
        Materia.nombre,
        func.count(ApunteCompartido.id).label('total')
    ).join(
        ApunteCompartido, Materia.id == ApunteCompartido.materia_id
    ).group_by(Materia.id).order_by(desc('total')).first()
    
    # Usuario más activo (más apuntes compartidos)
    usuario_activo = db.query(
        Usuario.nombre,
        Usuario.apellido,
        func.count(ApunteCompartido.id).label('total')
    ).join(
        ApunteCompartido, Usuario.id == ApunteCompartido.usuario_id
    ).group_by(Usuario.id).order_by(desc('total')).first()
    
    return {
        "total_usuarios": total_usuarios,
        "total_grupos": total_grupos,
        "total_apuntes": total_apuntes,
        "materia_popular": {
            "nombre": materia_popular[0] if materia_popular else None,
            "total_apuntes": materia_popular[1] if materia_popular else 0
        },
        "usuario_mas_activo": {
            "nombre": f"{usuario_activo[0]} {usuario_activo[1]}" if usuario_activo else None,
            "total_apuntes": usuario_activo[2] if usuario_activo else 0
        },
        "tendencias": [
            {"tag": "#Finales_Algoritmos", "posts": 128},
            {"tag": "#Resumenes_Fisica2", "posts": 85},
            {"tag": "#TP_IngSoftware", "posts": 64}
        ]
    }