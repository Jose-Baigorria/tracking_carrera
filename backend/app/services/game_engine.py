# backend/app/game_engine.py
from app.models.models import InscripcionMateria, Profesor, Materia, profesores_materias
from sqlalchemy.orm import joinedload

def check_unlocks(db, inscripcion_id):
    """
    Lógica de RPG: Al aprobar una materia, desbloquea al Jefe de Cátedra.
    Al inscribirse, desbloquea a los profesores comunes.
    """
    # Obtener la inscripción con la materia cargada
    inscripcion = db.query(InscripcionMateria).options(
        joinedload(InscripcionMateria.materia)
    ).filter(InscripcionMateria.id == inscripcion_id).first()
    
    if not inscripcion:
        return  # O podrías lanzar una excepción
    
    # Obtener los profesores asociados a la materia de la inscripción
    profesores = db.query(Profesor).join(
        profesores_materias, Profesor.id == profesores_materias.c.profesor_id
    ).filter(
        profesores_materias.c.materia_id == inscripcion.materia_id
    ).all()
    
    # 1. Desbloquear profesores de la materia
    for prof in profesores:
        if inscripcion.estado == "cursando":
            prof.desbloqueado = True
        elif inscripcion.estado == "aprobada" and prof.es_jefe_catedra:
            prof.desbloqueado = True
            
    db.commit()
    
    # 2. Opcional: Verificar logros relacionados (si quieres)
    # verificar_logros(db, inscripcion)