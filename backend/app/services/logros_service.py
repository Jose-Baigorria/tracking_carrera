from sqlalchemy.orm import Session
from app.models.models import (
    Logro, Nota, InscripcionMateria, Materia, SesionEstudio, 
    LogroDesbloqueado, FlashCard, Usuario, ActividadDiaria,
    LoginDiario, GrupoEstudio, SesionGrupo, ApunteCompartido,
    Agradecimiento, Tutoria, AusenciaOlvido
)
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, date
import json


class LogroService:
    """Servicio para verificar condiciones de logros"""
    
    @staticmethod
    def verificar_logro(logro_id: str, notas: List, inscripciones: List, 
                       materias: List, sesiones: List, db: Session, usuario_id: str = None) -> bool:
        """Verifica si se cumple la condición de un logro específico"""
        
        condiciones = {
            # ===== PRIMEROS PASOS =====
            'primer_2': lambda: LogroService._condicion_primer_2(notas),
            'primer_4': lambda: LogroService._condicion_primer_4(notas),
            'primer_5': lambda: LogroService._condicion_primer_5(notas),
            'primer_6': lambda: LogroService._condicion_primer_6(notas),
            'primer_7': lambda: LogroService._condicion_primer_7(notas),
            'primer_8': lambda: LogroService._condicion_primer_8(notas),
            'primer_9': lambda: LogroService._condicion_primer_9(notas),
            'primer_10': lambda: LogroService._condicion_primer_10(notas),
            'primera_materia_regular': lambda: LogroService._condicion_primera_materia_regular(inscripciones),
            'primera_materia_aprobada': lambda: LogroService._condicion_primera_materia_aprobada(inscripciones),
            'primera_materia_directa': lambda: LogroService._condicion_primera_materia_directa(inscripciones),
            '10_notas': lambda: LogroService._condicion_10_notas(notas),
            'primer_parcial': lambda: LogroService._condicion_primer_parcial(notas),
            'primer_tp': lambda: LogroService._condicion_primer_tp(notas),
            'primera_desaprobada': lambda: LogroService._condicion_primera_desaprobada(notas),
            'primer_nivel': lambda: LogroService._condicion_primer_nivel(inscripciones, materias),
            '5_materias': lambda: LogroService._condicion_5_materias(inscripciones),
            'promedio_5': lambda: LogroService._condicion_promedio_5(notas),
            '10_percent_carrera': lambda: LogroService._condicion_10_percent_carrera(inscripciones, materias),
            
            # ===== RACHAS Y CONSISTENCIA =====
            'racha_3_dieces': lambda: LogroService._condicion_racha_3_dieces(notas),
            'racha_5_aprobadas': lambda: LogroService._condicion_racha_5_aprobadas(notas),
            'racha_10_aprobadas': lambda: LogroService._condicion_racha_10_aprobadas(notas),
            'racha_5_sietes': lambda: LogroService._condicion_racha_5_sietes(notas),
            'racha_5_ochos': lambda: LogroService._condicion_racha_5_ochos(notas),
            'sin_desaprobar_mes': lambda: LogroService._condicion_sin_desaprobar_mes(notas),
            'todas_materias_aprobadas_cuatri': lambda: LogroService._condicion_todas_materias_aprobadas_cuatri(inscripciones),
            'mejora_continua': lambda: LogroService._condicion_mejora_continua(notas, inscripciones),
            'racha_parciales': lambda: LogroService._condicion_racha_parciales(notas),
            'racha_tps': lambda: LogroService._condicion_racha_tps(notas),
            'racha_7_materias': lambda: LogroService._condicion_racha_7_materias(inscripciones),
            'racha_10_dieces': lambda: LogroService._condicion_racha_10_dieces(notas),
            'sin_desaprobar_20': lambda: LogroService._condicion_sin_desaprobar_20(notas),
            'racha_verano': lambda: LogroService._condicion_racha_verano(notas),
            'racha_invierno': lambda: LogroService._condicion_racha_invierno(notas),

            # ===== COLECCIONES =====
            'coleccionista_10': lambda: LogroService._condicion_coleccionista_10(notas),
            'coleccionista_25': lambda: LogroService._condicion_coleccionista_25(notas),
            'coleccionista_50': lambda: LogroService._condicion_coleccionista_50(notas),
            'nueves_10': lambda: LogroService._condicion_nueves_10(notas),
            'nueves_25': lambda: LogroService._condicion_nueves_25(notas),
            'ochos_20': lambda: LogroService._condicion_ochos_20(notas),
            '50_notas': lambda: LogroService._condicion_50_notas(notas),
            '100_notas': lambda: LogroService._condicion_100_notas(notas),
            '200_notas': lambda: LogroService._condicion_200_notas(notas),
            '500_notas': lambda: LogroService._condicion_500_notas(notas),
            '50_parciales': lambda: LogroService._condicion_50_parciales(notas),
            '100_parciales': lambda: LogroService._condicion_100_parciales(notas),
            '50_tps': lambda: LogroService._condicion_50_tps(notas),
            '100_tps': lambda: LogroService._condicion_100_tps(notas),
            'todas_aprobadas_50': lambda: LogroService._condicion_todas_aprobadas_50(notas),
            'sin_doses': lambda: LogroService._condicion_sin_doses(notas),
            'sin_treses': lambda: LogroService._condicion_sin_treses(notas),
            'variedad': lambda: LogroService._condicion_variedad(notas),
            'solo_aprobadas_20': lambda: LogroService._condicion_solo_aprobadas_20(notas),
            'mejorando': lambda: LogroService._condicion_mejorando(notas),

            # ===== PROMEDIOS =====
            'promedio_6': lambda: LogroService._condicion_promedio_6(notas),
            'promedio_7': lambda: LogroService._condicion_promedio_7(notas),
            'promedio_8': lambda: LogroService._condicion_promedio_8(notas),
            'promedio_9': lambda: LogroService._condicion_promedio_9(notas),
            'promedio_9_5': lambda: LogroService._condicion_promedio_9_5(notas),
            'promedio_10': lambda: LogroService._condicion_promedio_10(notas),
            'promedio_parciales_8': lambda: LogroService._condicion_promedio_parciales_8(notas),
            'promedio_tps_9': lambda: LogroService._condicion_promedio_tps_9(notas),
            'mantener_promedio_8_year': lambda: LogroService._condicion_mantener_promedio_8_year(notas),
            'subir_promedio_1punto': lambda: LogroService._condicion_subir_promedio_1punto(notas),
            'mantener_7_50notas': lambda: LogroService._condicion_mantener_7_50notas(notas),
            'recuperacion_promedio': lambda: LogroService._condicion_recuperacion_promedio(notas),
            'promedio_primer_cuatri_8': lambda: LogroService._condicion_promedio_primer_cuatri_8(notas),
            'mejor_promedio_ultimo_cuatri': lambda: LogroService._condicion_mejor_promedio_ultimo_cuatri(notas),
            'equilibrado': lambda: LogroService._condicion_equilibrado(notas),
            'sin_bajar_promedio': lambda: LogroService._condicion_sin_bajar_promedio(notas),
            'promedio_7_todas_materias': lambda: LogroService._condicion_promedio_7_todas_materias(notas, inscripciones, materias),
            'promedio_8_mitad_carrera': lambda: LogroService._condicion_promedio_8_mitad_carrera(notas, inscripciones, materias),
            'top_10_percent': lambda: LogroService._condicion_top_10_percent(notas),
            'promedio_9_nivel': lambda: LogroService._condicion_promedio_9_nivel(notas, inscripciones, materias),

            # ===== PROGRESO DE CARRERA =====
            '20_percent_carrera': lambda: LogroService._condicion_20_percent_carrera(inscripciones, materias),
            '25_percent_carrera': lambda: LogroService._condicion_25_percent_carrera(inscripciones, materias),
            '33_percent_carrera': lambda: LogroService._condicion_33_percent_carrera(inscripciones, materias),
            '50_percent_carrera': lambda: LogroService._condicion_50_percent_carrera(inscripciones, materias),
            '66_percent_carrera': lambda: LogroService._condicion_66_percent_carrera(inscripciones, materias),
            '75_percent_carrera': lambda: LogroService._condicion_75_percent_carrera(inscripciones, materias),
            '90_percent_carrera': lambda: LogroService._condicion_90_percent_carrera(inscripciones, materias),
            'nivel_2_completo': lambda: LogroService._condicion_nivel_completo(inscripciones, materias, 2),
            'nivel_3_completo': lambda: LogroService._condicion_nivel_completo(inscripciones, materias, 3),
            'nivel_4_completo': lambda: LogroService._condicion_nivel_completo(inscripciones, materias, 4),
            'nivel_5_completo': lambda: LogroService._condicion_nivel_completo(inscripciones, materias, 5),
            '10_materias_aprobadas': lambda: LogroService._condicion_10_materias_aprobadas(inscripciones),
            '15_materias_aprobadas': lambda: LogroService._condicion_15_materias_aprobadas(inscripciones),
            '20_materias_aprobadas': lambda: LogroService._condicion_20_materias_aprobadas(inscripciones),
            '25_materias_aprobadas': lambda: LogroService._condicion_25_materias_aprobadas(inscripciones),
            '30_materias_aprobadas': lambda: LogroService._condicion_30_materias_aprobadas(inscripciones),
            'todas_obligatorias': lambda: LogroService._condicion_todas_obligatorias(inscripciones, materias),
            'primera_electiva': lambda: LogroService._condicion_primera_electiva(inscripciones, materias),
            '3_electivas': lambda: LogroService._condicion_3_electivas(inscripciones, materias),
            'todas_electivas': lambda: LogroService._condicion_todas_electivas(inscripciones, materias),
            'primer_año_completo': lambda: LogroService._condicion_primer_año_completo(inscripciones, materias),
            'segundo_año_completo': lambda: LogroService._condicion_segundo_año_completo(inscripciones, materias),
            'tercer_año_completo': lambda: LogroService._condicion_tercer_año_completo(inscripciones, materias),
            'cuarto_año_completo': lambda: LogroService._condicion_cuarto_año_completo(inscripciones, materias),
            'quinto_año_completo': lambda: LogroService._condicion_quinto_año_completo(inscripciones, materias),

            # ===== ESPECIALIDADES =====
            'matematico': lambda: LogroService._condicion_matematico(notas, inscripciones, materias),
            'programador': lambda: LogroService._condicion_programador(notas, inscripciones, materias),
            'fisico': lambda: LogroService._condicion_fisico(notas, inscripciones, materias),
            'ingeniero_software': lambda: LogroService._condicion_ingeniero_software(notas, inscripciones, materias),
            'redes_experto': lambda: LogroService._condicion_redes_experto(notas, inscripciones, materias),
            'bd_master': lambda: LogroService._condicion_bd_master(notas, inscripciones, materias),
            'ia_specialist': lambda: LogroService._condicion_ia_specialist(notas, inscripciones, materias),
            'sistemas_operativos_guru': lambda: LogroService._condicion_sistemas_operativos_guru(notas, inscripciones, materias),
            'algoritmico': lambda: LogroService._condicion_algoritmico(notas, inscripciones, materias),
            'arquitecto': lambda: LogroService._condicion_arquitecto(notas, inscripciones, materias),

            # ===== DESAFÍOS ESPECIALES =====
            'recuperacion_epica': lambda: LogroService._condicion_recuperacion_epica(notas, inscripciones),
            'comeback': lambda: LogroService._condicion_comeback(notas, inscripciones),
            'resistencia': lambda: LogroService._condicion_resistencia(notas, inscripciones),
            'salvado_por_la_campana': lambda: LogroService._condicion_salvado_por_la_campana(notas),
            'madrugador': lambda: LogroService._condicion_madrugador(sesiones),
            'noctambulo': lambda: LogroService._condicion_noctambulo(sesiones),
            'maraton': lambda: LogroService._condicion_maraton(sesiones),
            'sprint': lambda: LogroService._condicion_sprint(sesiones),
            'disciplinado': lambda: LogroService._condicion_disciplinado(sesiones),
            'multitasker': lambda: LogroService._condicion_multitasker(inscripciones),
            'velocidad': lambda: LogroService._condicion_velocidad(inscripciones),
            'perfeccion_cuatri': lambda: LogroService._condicion_perfeccion_cuatri(notas, inscripciones),
            'pomodoro_master': lambda: LogroService._condicion_pomodoro_master(sesiones),
            'flashcard_champion': lambda: LogroService._condicion_flashcard_champion(db),
            'recursante_exitoso': lambda: LogroService._condicion_recursante_exitoso(notas, inscripciones),
            'intensivo_verano': lambda: LogroService._condicion_intensivo_verano(inscripciones),

            # ===== TIEMPO Y DEDICACIÓN =====
            '100_horas_estudio': lambda: LogroService._condicion_100_horas_estudio(sesiones),
            '500_horas_estudio': lambda: LogroService._condicion_500_horas_estudio(sesiones),
            '1000_horas_estudio': lambda: LogroService._condicion_1000_horas_estudio(sesiones),
            'madrugon_domingo': lambda: LogroService._condicion_madrugon_domingo(sesiones),
            'fin_de_semana_warrior': lambda: LogroService._condicion_fin_de_semana_warrior(sesiones),

            # ===== RECOVERY =====
            'de_2_a_10': lambda: LogroService._condicion_de_2_a_10(notas),
            'segunda_oportunidad': lambda: LogroService._condicion_segunda_oportunidad(notas, inscripciones),
            'nunca_me_rindo': lambda: LogroService._condicion_nunca_me_rindo(notas, inscripciones),
            'recuperatorio_salvador': lambda: LogroService._condicion_recuperatorio_salvador(notas),
            'remontada': lambda: LogroService._condicion_remontada(notas, inscripciones),
            'milagro': lambda: LogroService._condicion_milagro(notas, inscripciones),
            'phoenix_rise': lambda: LogroService._condicion_phoenix_rise(notas),
            'del_abismo': lambda: LogroService._condicion_del_abismo(notas),
            'resiliencia': lambda: LogroService._condicion_resiliencia(notas, inscripciones),
            'mejor_version': lambda: LogroService._condicion_mejor_version(notas),

            # ===== SOCIAL =====
            'primer_grupo': lambda: LogroService._condicion_primer_grupo(db, usuario_id),
            'colaborador': lambda: LogroService._condicion_colaborador(db, usuario_id),
            'tutor': lambda: LogroService._condicion_tutor(db, usuario_id),
            'mejor_compañero': lambda: LogroService._condicion_mejor_companero(db, usuario_id),
            'lider_equipo': lambda: LogroService._condicion_lider_equipo(db, usuario_id),
            'networking': lambda: LogroService._condicion_networking(db, usuario_id),
            'explicador': lambda: LogroService._condicion_explicador(db, usuario_id),
            'organizador': lambda: LogroService._condicion_organizador(db, usuario_id),
            'comunidad': lambda: LogroService._condicion_comunidad(db, usuario_id),
            'mentor_senior': lambda: LogroService._condicion_mentor_senior(db, usuario_id),

            # ===== CURIOSOS Y DIVERTIDOS =====
            'nota_capicua': lambda: LogroService._condicion_nota_capicua(notas),
            'fibonacci': lambda: LogroService._condicion_fibonacci(notas),
            'lucky_7': lambda: LogroService._condicion_lucky_7(notas),
            'perfeccion_triple': lambda: LogroService._condicion_perfeccion_triple(notas),
            'viernes_13': lambda: LogroService._condicion_viernes_13(notas),
            'año_nuevo': lambda: LogroService._condicion_año_nuevo(sesiones),
            'navidad': lambda: LogroService._condicion_navidad(sesiones),
            'tu_cumpleaños': lambda: LogroService._condicion_tu_cumpleaños(db, usuario_id),
            'medianoche': lambda: LogroService._condicion_medianoche(sesiones),
            'maratonista_notas': lambda: LogroService._condicion_maratonista_notas(notas),
            'coleccionista_dieces': lambda: LogroService._condicion_coleccionista_dieces(notas),
            'equilibrio_zen': lambda: LogroService._condicion_equilibrio_zen(notas),
            'escalera': lambda: LogroService._condicion_escalera(notas),
            'monotonia': lambda: LogroService._condicion_monotonia(notas),
            'primer_dia_clases': lambda: LogroService._condicion_primer_dia_clases(notas, inscripciones),

            # ===== NEGATIVOS/HUMORÍSTICOS =====
            'primer_tropiezo': lambda: LogroService._condicion_primer_tropiezo(notas),
            'mala_racha': lambda: LogroService._condicion_mala_racha(notas),
            'procrastinador': lambda: LogroService._condicion_procrastinador(notas, sesiones),
            'racha_4s': lambda: LogroService._condicion_racha_4s(notas),
            'peor_nota': lambda: LogroService._condicion_peor_nota(notas),
            'recursante': lambda: LogroService._condicion_recursante(inscripciones),
            'casi': lambda: LogroService._condicion_casi(notas),

            # ===== FINALES Y GRADUACIÓN =====
            'ultimo_parcial': lambda: LogroService._condicion_ultimo_parcial(inscripciones, materias, notas),
            'ultimo_final': lambda: LogroService._condicion_ultimo_final(inscripciones, materias, notas),
            'todas_aprobadas': lambda: LogroService._condicion_todas_aprobadas(inscripciones, materias),
            'promedio_final_8': lambda: LogroService._condicion_promedio_final_8(notas, inscripciones, materias),
            'promedio_final_9': lambda: LogroService._condicion_promedio_final_9(notas, inscripciones, materias),
        }
        
        if logro_id in condiciones:
            try:
                return condiciones[logro_id]()
            except Exception as e:
                print(f"Error verificando logro {logro_id}: {e}")
                return False
        return False
    
    # ===== FUNCIONES AUXILIARES GENERALES =====
    
    @staticmethod
    def _parse_fecha(fecha_value):
        """Parsear fecha de string o retornar objeto date"""
        if isinstance(fecha_value, str):
            try:
                return datetime.strptime(fecha_value, "%Y-%m-%d").date()
            except:
                return None
        elif isinstance(fecha_value, datetime):
            return fecha_value.date()
        elif isinstance(fecha_value, date):
            return fecha_value
        return None
    
    @staticmethod
    def _calcular_promedio_general(notas: List[Nota]) -> float:
        """Calcula el promedio general de las notas que influyen en el promedio"""
        notas_con_promedio = [n for n in notas if n.influye_promedio and n.nota >= 4]
        if not notas_con_promedio:
            return 0.0
        return sum(n.nota for n in notas_con_promedio) / len(notas_con_promedio)
    
    @staticmethod
    def _obtener_promedio_materia(materia_id: str, notas: List[Nota], inscripciones: List[InscripcionMateria]) -> float:
        """Calcula el promedio de una materia específica"""
        inscripcion = next((i for i in inscripciones if i.materia_id == materia_id and i.estado == 'aprobada'), None)
        if not inscripcion:
            return 0.0
        
        notas_materia = [n for n in notas if n.inscripcion_id == inscripcion.id]
        if not notas_materia:
            return 0.0
        
        return sum(n.nota for n in notas_materia) / len(notas_materia)
    
    @staticmethod
    def _materia_cumple_condicion(materia_id: str, notas: List[Nota], inscripciones: List[InscripcionMateria], nota_minima: float) -> bool:
        """Verifica si una materia está aprobada y con promedio mínimo"""
        inscripcion = next((i for i in inscripciones if i.materia_id == materia_id and i.estado == 'aprobada'), None)
        if not inscripcion:
            return False
        
        promedio = LogroService._obtener_promedio_materia(materia_id, notas, inscripciones)
        return promedio >= nota_minima
    
    @staticmethod
    def _filtrar_materias_por_palabras_clave(materias: List[Materia], palabras_clave: List[str]) -> List[Materia]:
        """Filtra materias que contengan alguna de las palabras clave"""
        resultados = []
        for materia in materias:
            nombre_lower = materia.nombre.lower()
            for palabra in palabras_clave:
                if palabra in nombre_lower:
                    resultados.append(materia)
                    break
        return resultados
    
    @staticmethod
    def _calcular_porcentaje_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> float:
        """Calcula el porcentaje completado de la carrera"""
        # Total de materias obligatorias
        obligatorias = [m for m in materias if not m.es_electiva]
        if not obligatorias:
            return 0.0
        
        # Obligatorias aprobadas
        obligatorias_aprobadas = 0
        for materia in obligatorias:
            inscripcion = next((i for i in inscripciones if i.materia_id == materia.id and i.estado == 'aprobada'), None)
            if inscripcion:
                obligatorias_aprobadas += 1
        
        # Créditos de electivas aprobadas
        creditos_obtenidos = 0
        for inscripcion in inscripciones:
            if inscripcion.estado == 'aprobada':
                materia = next((m for m in materias if m.id == inscripcion.materia_id), None)
                if materia and materia.es_electiva:
                    creditos_obtenidos += materia.creditos or 0
        
        # Progreso calculado
        progreso = (obligatorias_aprobadas + (creditos_obtenidos / 20 * 7)) / (len(obligatorias) + 7)
        return progreso
    
    # ===== CONDICIONES PRIMEROS PASOS =====
    
    @staticmethod
    def _condicion_primer_2(notas: List[Nota]) -> bool:
        return len(notas) >= 1
    
    @staticmethod
    def _condicion_primer_4(notas: List[Nota]) -> bool:
        return any(n.nota >= 4 for n in notas)
    
    @staticmethod
    def _condicion_primer_5(notas: List[Nota]) -> bool:
        return any(n.nota >= 5 for n in notas)
    
    @staticmethod
    def _condicion_primer_6(notas: List[Nota]) -> bool:
        return any(n.nota >= 6 for n in notas)
    
    @staticmethod
    def _condicion_primer_7(notas: List[Nota]) -> bool:
        return any(n.nota >= 7 for n in notas)
    
    @staticmethod
    def _condicion_primer_8(notas: List[Nota]) -> bool:
        return any(n.nota >= 8 for n in notas)
    
    @staticmethod
    def _condicion_primer_9(notas: List[Nota]) -> bool:
        return any(n.nota >= 9 for n in notas)
    
    @staticmethod
    def _condicion_primer_10(notas: List[Nota]) -> bool:
        return any(n.nota == 10 for n in notas)
    
    @staticmethod
    def _condicion_primera_materia_regular(inscripciones: List[InscripcionMateria]) -> bool:
        return any(i.estado == 'regular' for i in inscripciones)
    
    @staticmethod
    def _condicion_primera_materia_aprobada(inscripciones: List[InscripcionMateria]) -> bool:
        return any(i.estado == 'aprobada' for i in inscripciones)
    
    @staticmethod
    def _condicion_primera_materia_directa(inscripciones: List[InscripcionMateria]) -> bool:
        return any(i.estado == 'aprobada' and i.promocionada for i in inscripciones)
    
    @staticmethod
    def _condicion_10_notas(notas: List[Nota]) -> bool:
        return len(notas) >= 10
    
    @staticmethod
    def _condicion_primer_parcial(notas: List[Nota]) -> bool:
        return any(n.es_parcial for n in notas)
    
    @staticmethod
    def _condicion_primer_tp(notas: List[Nota]) -> bool:
        return any(n.es_tp for n in notas)
    
    @staticmethod
    def _condicion_primera_desaprobada(notas: List[Nota]) -> bool:
        return any(n.nota < 4 for n in notas)
    
    @staticmethod
    def _condicion_primer_nivel(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        materias_nivel_1 = [m for m in materias if m.nivel == 1 and not m.es_electiva]
        if not materias_nivel_1:
            return False
        
        for materia in materias_nivel_1:
            inscripcion = next((i for i in inscripciones if i.materia_id == materia.id and i.estado == 'aprobada'), None)
            if not inscripcion:
                return False
        return True
    
    @staticmethod
    def _condicion_5_materias(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        return len(aprobadas) >= 5
    
    @staticmethod
    def _condicion_promedio_5(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 5
    
    @staticmethod
    def _condicion_10_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        porcentaje = LogroService._calcular_porcentaje_carrera(inscripciones, materias)
        return porcentaje >= 0.10
    
    # ===== CONDICIONES RACHAS Y CONSISTENCIA =====
    
    @staticmethod
    def _condicion_racha_3_dieces(notas: List[Nota]) -> bool:
        notas_con_fecha = [n for n in notas if n.fecha is not None]
        if len(notas_con_fecha) < 3:
            return False
        
        notas_ordenadas = sorted(notas_con_fecha, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 2):
            if (notas_ordenadas[i].nota == 10 and 
                notas_ordenadas[i+1].nota == 10 and 
                notas_ordenadas[i+2].nota == 10):
                return True
        return False
    
    @staticmethod
    def _condicion_racha_5_aprobadas(notas: List[Nota]) -> bool:
        racha = 0
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for nota in notas_ordenadas:
            if nota.nota >= 4:
                racha += 1
                if racha >= 5:
                    return True
            else:
                racha = 0
        return False
    
    @staticmethod
    def _condicion_racha_10_aprobadas(notas: List[Nota]) -> bool:
        racha = 0
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for nota in notas_ordenadas:
            if nota.nota >= 4:
                racha += 1
                if racha >= 10:
                    return True
            else:
                racha = 0
        return False
    
    @staticmethod
    def _condicion_racha_5_sietes(notas: List[Nota]) -> bool:
        racha = 0
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for nota in notas_ordenadas:
            if nota.nota >= 7:
                racha += 1
                if racha >= 5:
                    return True
            else:
                racha = 0
        return False
    
    @staticmethod
    def _condicion_racha_5_ochos(notas: List[Nota]) -> bool:
        racha = 0
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for nota in notas_ordenadas:
            if nota.nota >= 8:
                racha += 1
                if racha >= 5:
                    return True
            else:
                racha = 0
        return False
    
    @staticmethod
    def _condicion_sin_desaprobar_mes(notas: List[Nota]) -> bool:
        notas_por_mes = {}
        for nota in notas:
            fecha = nota.fecha
            if fecha is None:
                continue
            mes_anio = f"{fecha.year}-{fecha.month:02d}"
            if mes_anio not in notas_por_mes:
                notas_por_mes[mes_anio] = []
            notas_por_mes[mes_anio].append(nota)
        
        for notas_mes in notas_por_mes.values():
            if notas_mes and all(n.nota >= 4 for n in notas_mes):
                return True
        return False
    
    @staticmethod
    def _condicion_todas_materias_aprobadas_cuatri(inscripciones: List[InscripcionMateria]) -> bool:
        insc_por_cuatri = {}
        for insc in inscripciones:
            if insc.cuatrimestre:
                if insc.cuatrimestre not in insc_por_cuatri:
                    insc_por_cuatri[insc.cuatrimestre] = []
                insc_por_cuatri[insc.cuatrimestre].append(insc)
        
        for insc_cuatri in insc_por_cuatri.values():
            if insc_cuatri and all(i.estado == 'aprobada' for i in insc_cuatri):
                return True
        return False
    
    @staticmethod
    def _condicion_mejora_continua(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        promedios_por_cuatri = {}
        
        for nota in notas:
            fecha = nota.fecha
            if fecha is None:
                continue
            
            año = fecha.year
            mes = fecha.month
            
            cuatrimestre = 1 if 2 <= mes <= 6 else 2 if 8 <= mes <= 12 else None
            
            if cuatrimestre:
                key = f"{año}-{cuatrimestre}"
                if key not in promedios_por_cuatri:
                    promedios_por_cuatri[key] = []
                promedios_por_cuatri[key].append(nota.nota)
        
        if len(promedios_por_cuatri) < 3:
            return False
        
        cuatrimestres = []
        for key, calificaciones in promedios_por_cuatri.items():
            año, cuatri = key.split('-')
            cuatrimestres.append({
                'año': int(año),
                'cuatri': int(cuatri),
                'promedio': sum(calificaciones) / len(calificaciones)
            })
        
        cuatrimestres.sort(key=lambda x: (x['año'], x['cuatri']))
        
        for i in range(len(cuatrimestres) - 2):
            if (cuatrimestres[i]['promedio'] < cuatrimestres[i+1]['promedio'] and 
                cuatrimestres[i+1]['promedio'] < cuatrimestres[i+2]['promedio']):
                return True
        
        return False
    
    @staticmethod
    def _condicion_racha_parciales(notas: List[Nota]) -> bool:
        racha = 0
        parciales = [n for n in notas if n.es_parcial]
        parciales_ordenados = sorted(parciales, key=lambda x: x.fecha)
        
        for nota in parciales_ordenados:
            if nota.nota >= 4:
                racha += 1
                if racha >= 5:
                    return True
            else:
                racha = 0
        return False
    
    @staticmethod
    def _condicion_racha_tps(notas: List[Nota]) -> bool:
        racha = 0
        tps = [n for n in notas if n.es_tp]
        tps_ordenados = sorted(tps, key=lambda x: x.fecha)
        
        for nota in tps_ordenados:
            if nota.nota >= 4:
                racha += 1
                if racha >= 10:
                    return True
            else:
                racha = 0
        return False
    
    @staticmethod
    def _condicion_racha_7_materias(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada' and i.fecha_aprobacion]
        
        if len(aprobadas) < 7:
            return False
        
        aprobadas_ordenadas = sorted(aprobadas, key=lambda x: x.fecha_aprobacion)
        
        for i in range(len(aprobadas_ordenadas) - 6):
            fecha_inicio = LogroService._parse_fecha(aprobadas_ordenadas[i].fecha_aprobacion)
            fecha_fin = LogroService._parse_fecha(aprobadas_ordenadas[i+6].fecha_aprobacion)
            
            if fecha_inicio and fecha_fin:
                diferencia = (fecha_fin - fecha_inicio).days
                if diferencia < 365:
                    return True
        return False
    
    @staticmethod
    def _condicion_racha_10_dieces(notas: List[Nota]) -> bool:
        dieces = [n for n in notas if n.nota == 10]
        return len(dieces) >= 10
    
    @staticmethod
    def _condicion_sin_desaprobar_20(notas: List[Nota]) -> bool:
        if len(notas) < 20:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        ultimas_20 = notas_ordenadas[-20:] if len(notas_ordenadas) >= 20 else notas_ordenadas
        
        return all(n.nota >= 4 for n in ultimas_20)
    
    @staticmethod
    def _condicion_racha_verano(notas: List[Nota]) -> bool:
        notas_verano = []
        for nota in notas:
            fecha = nota.fecha
            if fecha is None:
                continue
            mes = fecha.month
            if mes in [1, 2, 12]:
                notas_verano.append(nota)
        
        aprobadas_verano = [n for n in notas_verano if n.nota >= 4]
        return len(aprobadas_verano) >= 3
    
    @staticmethod
    def _condicion_racha_invierno(notas: List[Nota]) -> bool:
        notas_invierno = []
        for nota in notas:
            fecha = nota.fecha
            if fecha is None:
                continue
            mes = fecha.month
            if mes in [6, 7, 8]:
                notas_invierno.append(nota)
        
        aprobadas_invierno = [n for n in notas_invierno if n.nota >= 4]
        return len(aprobadas_invierno) >= 3
    
    # ===== CONDICIONES COLECCIONES =====
    
    @staticmethod
    def _condicion_coleccionista_10(notas: List[Nota]) -> bool:
        dieces = [n for n in notas if n.nota == 10]
        return len(dieces) >= 10
    
    @staticmethod
    def _condicion_coleccionista_25(notas: List[Nota]) -> bool:
        dieces = [n for n in notas if n.nota == 10]
        return len(dieces) >= 25
    
    @staticmethod
    def _condicion_coleccionista_50(notas: List[Nota]) -> bool:
        dieces = [n for n in notas if n.nota == 10]
        return len(dieces) >= 50
    
    @staticmethod
    def _condicion_nueves_10(notas: List[Nota]) -> bool:
        nueves_o_mas = [n for n in notas if n.nota >= 9]
        return len(nueves_o_mas) >= 10
    
    @staticmethod
    def _condicion_nueves_25(notas: List[Nota]) -> bool:
        nueves_o_mas = [n for n in notas if n.nota >= 9]
        return len(nueves_o_mas) >= 25
    
    @staticmethod
    def _condicion_ochos_20(notas: List[Nota]) -> bool:
        ochos_o_mas = [n for n in notas if n.nota >= 8]
        return len(ochos_o_mas) >= 20
    
    @staticmethod
    def _condicion_50_notas(notas: List[Nota]) -> bool:
        return len(notas) >= 50
    
    @staticmethod
    def _condicion_100_notas(notas: List[Nota]) -> bool:
        return len(notas) >= 100
    
    @staticmethod
    def _condicion_200_notas(notas: List[Nota]) -> bool:
        return len(notas) >= 200
    
    @staticmethod
    def _condicion_500_notas(notas: List[Nota]) -> bool:
        return len(notas) >= 500
    
    @staticmethod
    def _condicion_50_parciales(notas: List[Nota]) -> bool:
        parciales = [n for n in notas if n.es_parcial]
        return len(parciales) >= 50
    
    @staticmethod
    def _condicion_100_parciales(notas: List[Nota]) -> bool:
        parciales = [n for n in notas if n.es_parcial]
        return len(parciales) >= 100
    
    @staticmethod
    def _condicion_50_tps(notas: List[Nota]) -> bool:
        tps = [n for n in notas if n.es_tp]
        return len(tps) >= 50
    
    @staticmethod
    def _condicion_100_tps(notas: List[Nota]) -> bool:
        tps = [n for n in notas if n.es_tp]
        return len(tps) >= 100
    
    @staticmethod
    def _condicion_todas_aprobadas_50(notas: List[Nota]) -> bool:
        if len(notas) < 50:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        primeras_50 = notas_ordenadas[:50]
        
        return all(n.nota >= 4 for n in primeras_50)
    
    @staticmethod
    def _condicion_sin_doses(notas: List[Nota]) -> bool:
        if len(notas) < 50:
            return False
        
        return not any(n.nota == 2 for n in notas)
    
    @staticmethod
    def _condicion_sin_treses(notas: List[Nota]) -> bool:
        if len(notas) < 50:
            return False
        
        return not any(n.nota == 3 for n in notas)
    
    @staticmethod
    def _condicion_variedad(notas: List[Nota]) -> bool:
        valores = set(int(n.nota) for n in notas)
        return all(valor in valores for valor in range(2, 11))
    
    @staticmethod
    def _condicion_solo_aprobadas_20(notas: List[Nota]) -> bool:
        if len(notas) < 20:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        primeras_20 = notas_ordenadas[:20]
        
        return all(n.nota >= 4 for n in primeras_20)
    
    @staticmethod
    def _condicion_mejorando(notas: List[Nota]) -> bool:
        if len(notas) < 5:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 4):
            mejorando = True
            for j in range(i, i + 4):
                if notas_ordenadas[j].nota >= notas_ordenadas[j + 1].nota:
                    mejorando = False
                    break
            
            if mejorando:
                return True
        
        return False
    
    # ===== CONDICIONES PROMEDIOS =====
    
    @staticmethod
    def _condicion_promedio_6(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 6
    
    @staticmethod
    def _condicion_promedio_7(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 7
    
    @staticmethod
    def _condicion_promedio_8(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 8
    
    @staticmethod
    def _condicion_promedio_9(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 9
    
    @staticmethod
    def _condicion_promedio_9_5(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 9.5
    
    @staticmethod
    def _condicion_promedio_10(notas: List[Nota]) -> bool:
        notas_con_promedio = [n for n in notas if n.influye_promedio and n.nota >= 4]
        if len(notas_con_promedio) < 10:
            return False
        return all(n.nota == 10 for n in notas_con_promedio)
    
    @staticmethod
    def _condicion_promedio_parciales_8(notas: List[Nota]) -> bool:
        parciales = [n for n in notas if n.es_parcial and n.influye_promedio and n.nota >= 4]
        if len(parciales) < 10:
            return False
        promedio = sum(n.nota for n in parciales) / len(parciales)
        return promedio >= 8
    
    @staticmethod
    def _condicion_promedio_tps_9(notas: List[Nota]) -> bool:
        tps = [n for n in notas if n.es_tp and n.influye_promedio and n.nota >= 4]
        if len(tps) < 10:
            return False
        promedio = sum(n.nota for n in tps) / len(tps)
        return promedio >= 9
    
    @staticmethod
    def _condicion_mantener_promedio_8_year(notas: List[Nota]) -> bool:
        notas_por_año = {}
        for nota in notas:
            fecha = nota.fecha
            if fecha is None:
                continue
            año = fecha.year
            if año not in notas_por_año:
                notas_por_año[año] = []
            notas_por_año[año].append(nota)
        
        for año, notas_año in notas_por_año.items():
            notas_con_promedio = [n for n in notas_año if n.influye_promedio and n.nota >= 4]
            if len(notas_con_promedio) >= 10:
                promedio = sum(n.nota for n in notas_con_promedio) / len(notas_con_promedio)
                if promedio >= 8:
                    return True
        return False
    
    @staticmethod
    def _condicion_subir_promedio_1punto(notas: List[Nota]) -> bool:
        if len(notas) < 2:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        mitad = len(notas_ordenadas) // 2
        
        primera_mitad = notas_ordenadas[:mitad]
        segunda_mitad = notas_ordenadas[mitad:]
        
        notas_con_promedio_1 = [n for n in primera_mitad if n.influye_promedio and n.nota >= 4]
        notas_con_promedio_2 = [n for n in segunda_mitad if n.influye_promedio and n.nota >= 4]
        
        if not notas_con_promedio_1 or not notas_con_promedio_2:
            return False
        
        promedio_1 = sum(n.nota for n in notas_con_promedio_1) / len(notas_con_promedio_1)
        promedio_2 = sum(n.nota for n in notas_con_promedio_2) / len(notas_con_promedio_2)
        
        return promedio_2 - promedio_1 >= 1
    
    @staticmethod
    def _condicion_mantener_7_50notas(notas: List[Nota]) -> bool:
        notas_con_promedio = [n for n in notas if n.influye_promedio and n.nota >= 4]
        if len(notas_con_promedio) < 50:
            return False
        
        promedio = sum(n.nota for n in notas_con_promedio) / len(notas_con_promedio)
        return promedio >= 7
    
    @staticmethod
    def _condicion_recuperacion_promedio(notas: List[Nota]) -> bool:
        if len(notas) < 30:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        tercio = len(notas_ordenadas) // 3
        
        primer_tercio = notas_ordenadas[:tercio]
        segundo_tercio = notas_ordenadas[tercio:2*tercio]
        tercer_tercio = notas_ordenadas[2*tercio:]
        
        def calcular_promedio_tercio(tercio_notas):
            notas_validas = [n for n in tercio_notas if n.influye_promedio and n.nota >= 4]
            if not notas_validas:
                return 0
            return sum(n.nota for n in notas_validas) / len(notas_validas)
        
        p1 = calcular_promedio_tercio(primer_tercio)
        p2 = calcular_promedio_tercio(segundo_tercio)
        p3 = calcular_promedio_tercio(tercer_tercio)
        
        return p2 < p1 and p3 > p2 and p3 > p1
    
    @staticmethod
    def _condicion_promedio_primer_cuatri_8(notas: List[Nota]) -> bool:
        if len(notas) == 0:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        primer_cuatri = notas_ordenadas[:min(15, len(notas_ordenadas))]
        
        notas_con_promedio = [n for n in primer_cuatri if n.influye_promedio and n.nota >= 4]
        if not notas_con_promedio:
            return False
        
        promedio = sum(n.nota for n in notas_con_promedio) / len(notas_con_promedio)
        return promedio >= 8
    
    @staticmethod
    def _condicion_mejor_promedio_ultimo_cuatri(notas: List[Nota]) -> bool:
        if len(notas) < 10:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        mitad = len(notas_ordenadas) // 2
        
        primer_mitad = notas_ordenadas[:mitad]
        segunda_mitad = notas_ordenadas[mitad:]
        
        notas_con_promedio_1 = [n for n in primer_mitad if n.influye_promedio and n.nota >= 4]
        notas_con_promedio_2 = [n for n in segunda_mitad if n.influye_promedio and n.nota >= 4]
        
        if not notas_con_promedio_1 or not notas_con_promedio_2:
            return False
        
        promedio_1 = sum(n.nota for n in notas_con_promedio_1) / len(notas_con_promedio_1)
        promedio_2 = sum(n.nota for n in notas_con_promedio_2) / len(notas_con_promedio_2)
        
        return promedio_2 > promedio_1
    
    @staticmethod
    def _condicion_equilibrado(notas: List[Nota]) -> bool:
        parciales = [n for n in notas if n.es_parcial and n.influye_promedio and n.nota >= 4]
        tps = [n for n in notas if n.es_tp and n.influye_promedio and n.nota >= 4]
        
        if len(parciales) < 5 or len(tps) < 5:
            return False
        
        promedio_parciales = sum(n.nota for n in parciales) / len(parciales)
        promedio_tps = sum(n.nota for n in tps) / len(tps)
        
        return abs(promedio_parciales - promedio_tps) <= 0.5
    
    @staticmethod
    def _condicion_sin_bajar_promedio(notas: List[Nota]) -> bool:
        if len(notas) < 20:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 19):
            ventana = notas_ordenadas[i:i+20]
            promedios_moviles = []
            
            for j in range(0, len(ventana) - 1, 2):
                if j+1 < len(ventana):
                    notas_par = ventana[j:j+2]
                    notas_validas = [n for n in notas_par if n.influye_promedio and n.nota >= 4]
                    if len(notas_validas) >= 2:
                        prom = sum(n.nota for n in notas_validas) / len(notas_validas)
                        promedios_moviles.append(prom)
            
            if len(promedios_moviles) >= 2:
                bajando = True
                for k in range(1, len(promedios_moviles)):
                    if promedios_moviles[k] < promedios_moviles[k-1]:
                        bajando = False
                        break
                
                if bajando:
                    return True
        
        return False
    
    @staticmethod
    def _condicion_promedio_7_todas_materias(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        notas_por_materia = {}
        for nota in notas:
            inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
            if inscripcion:
                materia_id = inscripcion.materia_id
                if materia_id not in notas_por_materia:
                    notas_por_materia[materia_id] = []
                notas_por_materia[materia_id].append(nota)
        
        for materia_id, notas_materia in notas_por_materia.items():
            notas_con_promedio = [n for n in notas_materia if n.influye_promedio and n.nota >= 4]
            if not notas_con_promedio:
                return False
            
            promedio = sum(n.nota for n in notas_con_promedio) / len(notas_con_promedio)
            if promedio < 7:
                return False
        
        return len(notas_por_materia) > 0
    
    @staticmethod
    def _condicion_promedio_8_mitad_carrera(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        porcentaje = LogroService._calcular_porcentaje_carrera(inscripciones, materias)
        if porcentaje < 0.5:
            return False
        
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 8
    
    @staticmethod
    def _condicion_top_10_percent(notas: List[Nota]) -> bool:
        promedio = LogroService._calcular_promedio_general(notas)
        return promedio >= 9
    
    @staticmethod
    def _condicion_promedio_9_nivel(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        notas_por_nivel = {}
        
        for nota in notas:
            inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
            if inscripcion:
                materia = next((m for m in materias if m.id == inscripcion.materia_id), None)
                if materia:
                    nivel = materia.nivel
                    if nivel not in notas_por_nivel:
                        notas_por_nivel[nivel] = []
                    notas_por_nivel[nivel].append(nota)
        
        for nivel, notas_nivel in notas_por_nivel.items():
            notas_con_promedio = [n for n in notas_nivel if n.influye_promedio and n.nota >= 4]
            if len(notas_con_promedio) >= 5:
                promedio = sum(n.nota for n in notas_con_promedio) / len(notas_con_promedio)
                if promedio >= 9:
                    return True
        
        return False
    
    # ===== CONDICIONES PROGRESO DE CARRERA =====
    
    @staticmethod
    def _condicion_porcentaje_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia], porcentaje: float) -> bool:
        progreso = LogroService._calcular_porcentaje_carrera(inscripciones, materias)
        return progreso >= (porcentaje / 100)
    
    @staticmethod
    def _condicion_20_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 20)
    
    @staticmethod
    def _condicion_25_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 25)
    
    @staticmethod
    def _condicion_33_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 33)
    
    @staticmethod
    def _condicion_50_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 50)
    
    @staticmethod
    def _condicion_66_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 66)
    
    @staticmethod
    def _condicion_75_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 75)
    
    @staticmethod
    def _condicion_90_percent_carrera(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_porcentaje_carrera(inscripciones, materias, 90)
    
    @staticmethod
    def _condicion_nivel_completo(inscripciones: List[InscripcionMateria], materias: List[Materia], nivel: int) -> bool:
        materias_nivel = [m for m in materias if m.nivel == nivel and not m.es_electiva]
        if not materias_nivel:
            return False
        
        for materia in materias_nivel:
            inscripcion = next((i for i in inscripciones if i.materia_id == materia.id and i.estado == 'aprobada'), None)
            if not inscripcion:
                return False
        
        return True
    
    @staticmethod
    def _condicion_10_materias_aprobadas(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        return len(aprobadas) >= 10
    
    @staticmethod
    def _condicion_15_materias_aprobadas(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        return len(aprobadas) >= 15
    
    @staticmethod
    def _condicion_20_materias_aprobadas(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        return len(aprobadas) >= 20
    
    @staticmethod
    def _condicion_25_materias_aprobadas(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        return len(aprobadas) >= 25
    
    @staticmethod
    def _condicion_30_materias_aprobadas(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        return len(aprobadas) >= 30
    
    @staticmethod
    def _condicion_todas_obligatorias(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        obligatorias = [m for m in materias if not m.es_electiva]
        if not obligatorias:
            return False
        
        for materia in obligatorias:
            inscripcion = next((i for i in inscripciones if i.materia_id == materia.id and i.estado == 'aprobada'), None)
            if not inscripcion:
                return False
        
        return True
    
    @staticmethod
    def _condicion_primera_electiva(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        for inscripcion in inscripciones:
            if inscripcion.estado == 'aprobada':
                materia = next((m for m in materias if m.id == inscripcion.materia_id), None)
                if materia and materia.es_electiva:
                    return True
        return False
    
    @staticmethod
    def _condicion_3_electivas(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        electivas_aprobadas = 0
        for inscripcion in inscripciones:
            if inscripcion.estado == 'aprobada':
                materia = next((m for m in materias if m.id == inscripcion.materia_id), None)
                if materia and materia.es_electiva:
                    electivas_aprobadas += 1
        
        return electivas_aprobadas >= 3
    
    @staticmethod
    def _condicion_todas_electivas(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        electivas = [m for m in materias if m.es_electiva]
        if not electivas:
            return False
        
        for materia in electivas:
            inscripcion = next((i for i in inscripciones if i.materia_id == materia.id and i.estado == 'aprobada'), None)
            if not inscripcion:
                return False
        
        return True
    
    @staticmethod
    def _condicion_primer_año_completo(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_nivel_completo(inscripciones, materias, 1)
    
    @staticmethod
    def _condicion_segundo_año_completo(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_nivel_completo(inscripciones, materias, 2)
    
    @staticmethod
    def _condicion_tercer_año_completo(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_nivel_completo(inscripciones, materias, 3)
    
    @staticmethod
    def _condicion_cuarto_año_completo(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_nivel_completo(inscripciones, materias, 4)
    
    @staticmethod
    def _condicion_quinto_año_completo(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return LogroService._condicion_nivel_completo(inscripciones, materias, 5)
    
    # ===== CONDICIONES ESPECIALIDADES =====
    
    @staticmethod
    def _condicion_matematico(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['análisis', 'álgebra', 'matemática', 'matematica', 'cálculo', 'calculo']
        materias_matematicas = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materias_matematicas:
            return False
        
        for materia in materias_matematicas:
            if not LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 7):
                return False
        
        return True
    
    @staticmethod
    def _condicion_programador(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['programación', 'programacion', 'algoritmo', 'software', 'lenguaje']
        materias_programacion = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materias_programacion:
            return False
        
        for materia in materias_programacion:
            if not LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 8):
                return False
        
        return True
    
    @staticmethod
    def _condicion_fisico(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['física', 'fisica']
        materias_fisica = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materias_fisica:
            return False
        
        for materia in materias_fisica:
            if not LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 7):
                return False
        
        return True
    
    @staticmethod
    def _condicion_ingeniero_software(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['ingeniería', 'ingenieria', 'software', 'desarrollo', 'sistema']
        materias_ing_software = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materias_ing_software:
            return False
        
        for materia in materias_ing_software:
            if not LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 8):
                return False
        
        return True
    
    @staticmethod
    def _condicion_redes_experto(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['redes', 'comunicación', 'comunicacion']
        materias_redes = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        materias_redes_aprobadas = []
        for materia in materias_redes:
            if LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 4):
                materias_redes_aprobadas.append(materia)
        
        if not materias_redes_aprobadas:
            return False
        
        promedios = []
        for materia in materias_redes_aprobadas:
            promedio = LogroService._obtener_promedio_materia(materia.id, notas, inscripciones)
            promedios.append(promedio)
        
        promedio_general = sum(promedios) / len(promedios)
        return promedio_general >= 9
    
    @staticmethod
    def _condicion_bd_master(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['base de datos', 'bases de datos', 'bd', 'database']
        materias_bd = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        materias_bd_aprobadas = []
        for materia in materias_bd:
            if LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 4):
                materias_bd_aprobadas.append(materia)
        
        if not materias_bd_aprobadas:
            return False
        
        promedios = []
        for materia in materias_bd_aprobadas:
            promedio = LogroService._obtener_promedio_materia(materia.id, notas, inscripciones)
            promedios.append(promedio)
        
        promedio_general = sum(promedios) / len(promedios)
        return promedio_general >= 9
    
    @staticmethod
    def _condicion_ia_specialist(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['inteligencia artificial', 'ia', 'aprendizaje', 'machine learning']
        materias_ia = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materias_ia:
            return False
        
        for materia in materias_ia:
            if not LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 9):
                return False
        
        return True
    
    @staticmethod
    def _condicion_sistemas_operativos_guru(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['sistemas operativos', 'sistema operativo']
        materia_so = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materia_so:
            return False
        
        materia = materia_so[0]
        return LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 10)
    
    @staticmethod
    def _condicion_algoritmico(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['algoritmo', 'estructura de datos', 'algoritmos']
        materia_algoritmos = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materia_algoritmos:
            return False
        
        materia = materia_algoritmos[0]
        return LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 9)
    
    @staticmethod
    def _condicion_arquitecto(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        palabras_clave = ['arquitectura']
        materia_arquitectura = LogroService._filtrar_materias_por_palabras_clave(materias, palabras_clave)
        
        if not materia_arquitectura:
            return False
        
        materia = materia_arquitectura[0]
        return LogroService._materia_cumple_condicion(materia.id, notas, inscripciones, 9)
    
    # ===== CONDICIONES DESAFÍOS ESPECIALES =====
    
    @staticmethod
    def _condicion_recuperacion_epica(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        notas_por_materia = {}
        for nota in notas:
            if nota.es_parcial:
                inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
                if inscripcion:
                    materia_id = inscripcion.materia_id
                    if materia_id not in notas_por_materia:
                        notas_por_materia[materia_id] = []
                    notas_por_materia[materia_id].append(nota)
        
        for materia_id, notas_materia in notas_por_materia.items():
            notas_materia_ordenadas = sorted(notas_materia, key=lambda x: x.fecha)
            
            for i, nota in enumerate(notas_materia_ordenadas):
                if nota.es_parcial and nota.nota < 4:
                    for j in range(i + 1, len(notas_materia_ordenadas)):
                        nota_posterior = notas_materia_ordenadas[j]
                        if nota_posterior.nota == 10:
                            try:
                                fecha_parcial = nota.fecha
                                fecha_recuperatorio = nota_posterior.fecha
                                if fecha_parcial and fecha_recuperatorio:
                                    diferencia_dias = (fecha_recuperatorio - fecha_parcial).days
                                    if 1 <= diferencia_dias <= 30:
                                        return True
                            except:
                                return True
        return False
    
    @staticmethod
    def _condicion_comeback(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        if len(notas) < 10:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        mitad = len(notas_ordenadas) // 2
        primer_periodo = notas_ordenadas[:mitad]
        segundo_periodo = notas_ordenadas[mitad:]
        
        notas_con_promedio_1 = [n for n in primer_periodo if n.influye_promedio and n.nota >= 4]
        notas_con_promedio_2 = [n for n in segundo_periodo if n.influye_promedio and n.nota >= 4]
        
        if not notas_con_promedio_1 or not notas_con_promedio_2:
            return False
        
        promedio_1 = sum(n.nota for n in notas_con_promedio_1) / len(notas_con_promedio_1)
        promedio_2 = sum(n.nota for n in notas_con_promedio_2) / len(notas_con_promedio_2)
        
        return promedio_1 <= 6 and promedio_2 >= 8
    
    @staticmethod
    def _condicion_resistencia(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        notas_por_materia = {}
        
        for nota in notas:
            inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
            if inscripcion:
                materia_id = inscripcion.materia_id
                if materia_id not in notas_por_materia:
                    notas_por_materia[materia_id] = []
                notas_por_materia[materia_id].append(nota)
        
        for materia_id, notas_materia in notas_por_materia.items():
            if len(notas_materia) >= 3:
                inscripcion = next((i for i in inscripciones if i.materia_id == materia_id and i.estado == 'aprobada'), None)
                if inscripcion:
                    return True
        
        return False
    
    @staticmethod
    def _condicion_salvado_por_la_campana(notas: List[Nota]) -> bool:
        notas_4 = [n for n in notas if abs(n.nota - 4.0) < 0.01]
        
        if not notas_4:
            return False
        
        for nota_4 in notas_4:
            notas_inscripcion = [n for n in notas if n.inscripcion_id == nota_4.inscripcion_id]
            notas_inscripcion_ordenadas = sorted(notas_inscripcion, key=lambda x: x.fecha)
            
            if notas_inscripcion_ordenadas and notas_inscripcion_ordenadas[-1].id == nota_4.id:
                if len(notas_inscripcion_ordenadas) > 1:
                    for nota_anterior in notas_inscripcion_ordenadas[:-1]:
                        if nota_anterior.nota < 4:
                            return True
        
        return False
    
    @staticmethod
    def _condicion_madrugador(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones or len(sesiones) < 7:
            return False
        
        sesiones_madrugador = []
        for sesion in sesiones:
            try:
                if sesion.hora_inicio and sesion.hora_inicio.hour < 6:
                    fecha_str = sesion.fecha.isoformat()
                    sesiones_madrugador.append(fecha_str)
            except:
                continue
        
        fechas_unicas = sorted(list(set(sesiones_madrugador)))
        
        for i in range(len(fechas_unicas) - 6):
            try:
                fecha_inicio = datetime.strptime(fechas_unicas[i], "%Y-%m-%d").date()
                fecha_fin = datetime.strptime(fechas_unicas[i + 6], "%Y-%m-%d").date()
                diferencia = (fecha_fin - fecha_inicio).days
                if diferencia == 6:
                    return True
            except:
                continue
        
        return False
    
    @staticmethod
    def _condicion_noctambulo(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones or len(sesiones) < 10:
            return False
        
        sesiones_noche = []
        for sesion in sesiones:
            try:
                if sesion.hora_inicio and sesion.hora_inicio.hour >= 23:
                    fecha_str = sesion.fecha.isoformat()
                    sesiones_noche.append(fecha_str)
            except:
                continue
        
        fechas_unicas = sorted(list(set(sesiones_noche)))
        
        for i in range(len(fechas_unicas) - 9):
            try:
                fecha_inicio = datetime.strptime(fechas_unicas[i], "%Y-%m-%d").date()
                fecha_fin = datetime.strptime(fechas_unicas[i + 9], "%Y-%m-%d").date()
                diferencia = (fecha_fin - fecha_inicio).days
                if diferencia == 9:
                    return True
            except:
                continue
        
        return False
    
    @staticmethod
    def _condicion_maraton(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        
        horas_por_dia = {}
        for sesion in sesiones:
            try:
                fecha_str = sesion.fecha.isoformat()
                duracion_horas = (sesion.duracion_minutos or 0) / 60.0
                
                if fecha_str not in horas_por_dia:
                    horas_por_dia[fecha_str] = 0
                horas_por_dia[fecha_str] += duracion_horas
            except:
                continue
        
        return any(horas >= 8 for horas in horas_por_dia.values())
    
    @staticmethod
    def _condicion_sprint(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        
        return any((sesion.duracion_minutos or 0) >= 240 for sesion in sesiones)
    
    @staticmethod
    def _condicion_disciplinado(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones or len(sesiones) < 30:
            return False
        
        fechas = []
        for sesion in sesiones:
            try:
                fecha_str = sesion.fecha.isoformat()
                fechas.append(fecha_str)
            except:
                continue
        
        fechas_unicas = sorted(list(set(fechas)))
        
        for i in range(len(fechas_unicas) - 29):
            try:
                fecha_inicio = datetime.strptime(fechas_unicas[i], "%Y-%m-%d").date()
                fecha_fin = datetime.strptime(fechas_unicas[i + 29], "%Y-%m-%d").date()
                diferencia = (fecha_fin - fecha_inicio).days
                if diferencia == 29:
                    return True
            except:
                continue
        
        return False
    
    @staticmethod
    def _condicion_multitasker(inscripciones: List[InscripcionMateria]) -> bool:
        materias_cursando = [i for i in inscripciones if i.estado == 'cursando']
        return len(materias_cursando) >= 6
    
    @staticmethod
    def _condicion_velocidad(inscripciones: List[InscripcionMateria]) -> bool:
        for inscripcion in inscripciones:
            if inscripcion.estado == 'aprobada' and inscripcion.fecha_inscripcion and inscripcion.fecha_aprobacion:
                try:
                    fecha_inicio = LogroService._parse_fecha(inscripcion.fecha_inscripcion)
                    fecha_fin = LogroService._parse_fecha(inscripcion.fecha_aprobacion)
                    if fecha_inicio and fecha_fin:
                        diferencia_dias = (fecha_fin - fecha_inicio).days
                        if diferencia_dias <= 30:
                            return True
                except:
                    continue
        
        return False
    
    @staticmethod
    def _condicion_perfeccion_cuatri(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        if len(notas) < 5:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 4):
            periodo = notas_ordenadas[i:i+5]
            if all(abs(n.nota - 10.0) < 0.01 for n in periodo):
                return True
        
        return False
    
    @staticmethod
    def _condicion_pomodoro_master(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        
        sesiones_pomodoro = [s for s in sesiones if s.tipo == 'pomodoro']
        return len(sesiones_pomodoro) >= 100
    
    @staticmethod
    def _condicion_flashcard_champion(db: Session) -> bool:
        total_flashcards = db.query(FlashCard).count()
        hoy = date.today().isoformat()
        
        try:
            flashcards_repasadas = db.query(FlashCard).filter(
                FlashCard.proxima_revision < hoy
            ).count()
        except:
            flashcards_repasadas = 0
        
        return total_flashcards >= 1000 or flashcards_repasadas >= 1000
    
    @staticmethod
    def _condicion_recursante_exitoso(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        from collections import defaultdict
        inscripciones_por_materia = defaultdict(list)
        for inscripcion in inscripciones:
            inscripciones_por_materia[inscripcion.materia_id].append(inscripcion)
        
        for materia_id, inscripciones_materia in inscripciones_por_materia.items():
            if len(inscripciones_materia) >= 2:
                inscripcion_aprobada = next(
                    (i for i in inscripciones_materia if i.estado == 'aprobada'), 
                    None
                )
                
                if inscripcion_aprobada:
                    notas_materia = []
                    for inscripcion in inscripciones_materia:
                        notas_insc = [n for n in notas if n.inscripcion_id == inscripcion.id]
                        notas_materia.extend(notas_insc)
                    
                    if notas_materia:
                        promedio = sum(n.nota for n in notas_materia) / len(notas_materia)
                        if promedio >= 9:
                            return True
        
        return False
    
    @staticmethod
    def _condicion_intensivo_verano(inscripciones: List[InscripcionMateria]) -> bool:
        aprobadas_verano = 0
        
        for inscripcion in inscripciones:
            if inscripcion.estado == 'aprobada' and inscripcion.fecha_aprobacion:
                try:
                    fecha = LogroService._parse_fecha(inscripcion.fecha_aprobacion)
                    if fecha:
                        mes = fecha.month
                        if mes in [1, 2, 12]:
                            aprobadas_verano += 1
                            if aprobadas_verano >= 3:
                                return True
                except:
                    continue
        
        return False
    
    # ===== CONDICIONES TIEMPO Y DEDICACIÓN =====
    
    @staticmethod
    def _condicion_100_horas_estudio(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        total_minutos = sum(s.duracion_minutos or 0 for s in sesiones)
        total_horas = total_minutos / 60.0
        return total_horas >= 100
    
    @staticmethod
    def _condicion_500_horas_estudio(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        total_minutos = sum(s.duracion_minutos or 0 for s in sesiones)
        total_horas = total_minutos / 60.0
        return total_horas >= 500
    
    @staticmethod
    def _condicion_1000_horas_estudio(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        total_minutos = sum(s.duracion_minutos or 0 for s in sesiones)
        total_horas = total_minutos / 60.0
        return total_horas >= 1000
    
    @staticmethod
    def _condicion_madrugon_domingo(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        
        for sesion in sesiones:
            try:
                if sesion.fecha and sesion.fecha.weekday() == 6:
                    if sesion.hora_inicio and sesion.hora_inicio.hour < 8:
                        return True
            except:
                continue
        return False
    
    @staticmethod
    def _condicion_fin_de_semana_warrior(sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        
        horas_por_fecha = {}
        for sesion in sesiones:
            try:
                if sesion.fecha and sesion.fecha.weekday() >= 5:
                    fecha_str = sesion.fecha.isoformat()
                    duracion_horas = (sesion.duracion_minutos or 0) / 60.0
                    horas_por_fecha[fecha_str] = horas_por_fecha.get(fecha_str, 0) + duracion_horas
            except:
                continue
        
        return any(horas >= 10 for horas in horas_por_fecha.values())
    
    # ===== CONDICIONES RECOVERY =====
    
    @staticmethod
    def _condicion_de_2_a_10(notas: List[Nota]) -> bool:
        notas_por_inscripcion = {}
        for nota in notas:
            if nota.inscripcion_id not in notas_por_inscripcion:
                notas_por_inscripcion[nota.inscripcion_id] = []
            notas_por_inscripcion[nota.inscripcion_id].append(nota.nota)
        
        for notas_insc in notas_por_inscripcion.values():
            tiene_2 = any(n == 2 for n in notas_insc)
            tiene_10 = any(n == 10 for n in notas_insc)
            if tiene_2 and tiene_10:
                return True
        return False
    
    @staticmethod
    def _condicion_segunda_oportunidad(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        notas_por_materia = {}
        for inscripcion in inscripciones:
            if inscripcion.materia_id not in notas_por_materia:
                notas_por_materia[inscripcion.materia_id] = []
        
        for nota in notas:
            inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
            if inscripcion and inscripcion.materia_id in notas_por_materia:
                notas_por_materia[inscripcion.materia_id].append(nota)
        
        for materia_id, notas_materia in notas_por_materia.items():
            if not notas_materia:
                continue
            
            fechas_parciales = set()
            for nota in notas_materia:
                if nota.es_parcial:
                    fechas_parciales.add(nota.fecha)
            
            inscripcion = next((i for i in inscripciones if i.materia_id == materia_id and i.estado == 'aprobada'), None)
            
            if len(fechas_parciales) == 2 and inscripcion:
                return True
        
        return False
    
    @staticmethod
    def _condicion_nunca_me_rindo(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        notas_por_materia = {}
        for inscripcion in inscripciones:
            if inscripcion.materia_id not in notas_por_materia:
                notas_por_materia[inscripcion.materia_id] = []
        
        for nota in notas:
            inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
            if inscripcion and inscripcion.materia_id in notas_por_materia:
                notas_por_materia[inscripcion.materia_id].append(nota)
        
        for materia_id, notas_materia in notas_por_materia.items():
            if not notas_materia:
                continue
            
            fechas_examenes = set()
            for nota in notas_materia:
                if nota.es_parcial or nota.es_final:
                    fechas_examenes.add(nota.fecha)
            
            inscripcion = next((i for i in inscripciones if i.materia_id == materia_id and i.estado == 'aprobada'), None)
            
            if len(fechas_examenes) >= 4 and inscripcion:
                return True
        
        return False
    
    @staticmethod
    def _condicion_recuperatorio_salvador(notas: List[Nota]) -> bool:
        parciales_ordenados = sorted([n for n in notas if n.es_parcial], 
                                    key=lambda x: (x.inscripcion_id, x.fecha))
        
        recuperatorios_aprobados = 0
        
        for i in range(1, len(parciales_ordenados)):
            if (parciales_ordenados[i].inscripcion_id == parciales_ordenados[i-1].inscripcion_id and
                parciales_ordenados[i-1].nota < 4 and
                parciales_ordenados[i].nota >= 4):
                recuperatorios_aprobados += 1
        
        return recuperatorios_aprobados >= 5
    
    @staticmethod
    def _condicion_remontada(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        notas_por_inscripcion = {}
        for nota in notas:
            if nota.inscripcion_id not in notas_por_inscripcion:
                notas_por_inscripcion[nota.inscripcion_id] = []
            notas_por_inscripcion[nota.inscripcion_id].append(nota)
        
        for inscripcion in inscripciones:
            if inscripcion.estado != 'aprobada':
                continue
            
            notas_insc = notas_por_inscripcion.get(inscripcion.id, [])
            parciales = [n for n in notas_insc if n.es_parcial]
            
            if len(parciales) >= 2:
                primeros_parciales = sorted(parciales, key=lambda x: x.fecha)[:2]
                if all(p.nota < 4 for p in primeros_parciales):
                    return True
        
        return False
    
    @staticmethod
    def _condicion_milagro(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        for inscripcion in inscripciones:
            if not inscripcion.promocionada:
                continue
            
            parciales = sorted([n for n in notas if n.inscripcion_id == inscripcion.id and n.es_parcial],
                            key=lambda x: x.fecha)
            
            if parciales and parciales[0].nota < 6:
                return True
        
        return False
    
    @staticmethod
    def _condicion_phoenix_rise(notas: List[Nota]) -> bool:
        if len(notas) < 10:
            return False
        
        notas_por_periodo = {}
        for nota in notas:
            try:
                fecha = nota.fecha
                if fecha:
                    periodo = f"{fecha.year}-{(fecha.month-1)//4+1}"
                    if periodo not in notas_por_periodo:
                        notas_por_periodo[periodo] = []
                    notas_por_periodo[periodo].append(nota)
            except:
                continue
        
        if len(notas_por_periodo) < 2:
            return False
        
        promedios = []
        for periodo in sorted(notas_por_periodo.keys()):
            notas_periodo = [n for n in notas_por_periodo[periodo] if n.influye_promedio and n.nota >= 4]
            if notas_periodo:
                promedio = sum(n.nota for n in notas_periodo) / len(notas_periodo)
                promedios.append(promedio)
        
        for i in range(1, len(promedios)):
            if promedios[i] - promedios[i-1] >= 3:
                return True
        
        return False
    
    @staticmethod
    def _condicion_del_abismo(notas: List[Nota]) -> bool:
        if len(notas) < 10:
            return False
        
        notas_ordenadas = sorted([n for n in notas if n.fecha], key=lambda x: x.fecha)
        
        mitad = len(notas_ordenadas) // 2
        primera_mitad = notas_ordenadas[:mitad]
        segunda_mitad = notas_ordenadas[mitad:]
        
        notas_validas_primera = [n for n in primera_mitad if n.influye_promedio and n.nota >= 4]
        notas_validas_segunda = [n for n in segunda_mitad if n.influye_promedio and n.nota >= 4]
        
        if not notas_validas_primera or not notas_validas_segunda:
            return False
        
        promedio_primera = sum(n.nota for n in notas_validas_primera) / len(notas_validas_primera)
        promedio_segunda = sum(n.nota for n in notas_validas_segunda) / len(notas_validas_segunda)
        
        return promedio_primera < 5 and promedio_segunda >= 7
    
    @staticmethod
    def _condicion_resiliencia(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        materias_con_desaprobadas = set()
        for nota in notas:
            if nota.nota < 4:
                inscripcion = next((i for i in inscripciones if i.id == nota.inscripcion_id), None)
                if inscripcion:
                    materias_con_desaprobadas.add(inscripcion.materia_id)
        
        materias_aprobadas = [i for i in inscripciones if i.estado == 'aprobada']
        
        return len(materias_con_desaprobadas) >= 3 and len(materias_aprobadas) >= 5
    
    @staticmethod
    def _condicion_mejor_version(notas: List[Nota]) -> bool:
        if len(notas) < 10:
            return False
        
        notas_ordenadas = sorted([n for n in notas if n.fecha], key=lambda x: x.fecha)
        
        tercio = len(notas_ordenadas) // 3
        if tercio < 3:
            return False
        
        primera_parte = notas_ordenadas[:tercio]
        ultima_parte = notas_ordenadas[-tercio:]
        
        notas_validas_primera = [n for n in primera_parte if n.influye_promedio and n.nota >= 4]
        notas_validas_ultima = [n for n in ultima_parte if n.influye_promedio and n.nota >= 4]
        
        if not notas_validas_primera or not notas_validas_ultima:
            return False
        
        promedio_primera = sum(n.nota for n in notas_validas_primera) / len(notas_validas_primera)
        promedio_ultima = sum(n.nota for n in notas_validas_ultima) / len(notas_validas_ultima)
        
        return promedio_ultima > promedio_primera
    
    # ===== CONDICIONES SOCIAL =====
    
    @staticmethod
    def _condicion_primer_grupo(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        grupos = db.query(GrupoEstudio).filter(
            (GrupoEstudio.creador_id == usuario_id) | 
            (GrupoEstudio.integrantes.any(id=usuario_id))
        ).count()
        
        return grupos >= 1
    
    @staticmethod
    def _condicion_colaborador(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        apuntes = db.query(ApunteCompartido).filter(
            ApunteCompartido.usuario_id == usuario_id
        ).count()
        
        return apuntes >= 5
    
    @staticmethod
    def _condicion_tutor(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        tutorias = db.query(Tutoria).filter(
            Tutoria.tutor_id == usuario_id
        ).count()
        
        return tutorias >= 3
    
    @staticmethod
    def _condicion_mejor_companero(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        agradecimientos = db.query(Agradecimiento).filter(
            Agradecimiento.receptor_id == usuario_id
        ).count()
        
        return agradecimientos >= 5
    
    @staticmethod
    def _condicion_lider_equipo(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        grupos = db.query(GrupoEstudio).filter(
            GrupoEstudio.creador_id == usuario_id
        ).count()
        
        return grupos >= 2
    
    @staticmethod
    def _condicion_networking(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        grupos = db.query(GrupoEstudio).filter(
            GrupoEstudio.integrantes.any(id=usuario_id)
        ).count()
        
        return grupos >= 3
    
    @staticmethod
    def _condicion_explicador(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        agradecimientos = db.query(Agradecimiento).filter(
            Agradecimiento.emisor_id == usuario_id,
            Agradecimiento.tipo == 'explicacion'
        ).count()
        
        return agradecimientos >= 10
    
    @staticmethod
    def _condicion_organizador(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        sesiones = db.query(SesionGrupo).join(GrupoEstudio).filter(
            GrupoEstudio.creador_id == usuario_id
        ).count()
        
        return sesiones >= 5
    
    @staticmethod
    def _condicion_comunidad(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        grupos = db.query(GrupoEstudio).filter(
            GrupoEstudio.integrantes.any(id=usuario_id)
        ).count()
        
        apuntes = db.query(ApunteCompartido).filter(
            ApunteCompartido.usuario_id == usuario_id
        ).count()
        
        tutorias = db.query(Tutoria).filter(
            Tutoria.tutor_id == usuario_id
        ).count()
        
        return grupos >= 2 and apuntes >= 3 and tutorias >= 1
    
    @staticmethod
    def _condicion_mentor_senior(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        tutorias = db.query(Tutoria).filter(
            Tutoria.tutor_id == usuario_id,
            Tutoria.exito == True
        ).count()
        
        return tutorias >= 10
    
    # ===== CONDICIONES CURIOSOS Y DIVERTIDOS =====
    
    @staticmethod
    def _condicion_nota_capicua(notas: List[Nota]) -> bool:
        if len(notas) < 3:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 2):
            nota1 = int(notas_ordenadas[i].nota)
            nota2 = int(notas_ordenadas[i+1].nota)
            nota3 = int(notas_ordenadas[i+2].nota)
            
            if nota1 == nota2 == nota3:
                return True
        
        return False
    
    @staticmethod
    def _condicion_fibonacci(notas: List[Nota]) -> bool:
        if len(notas) < 3:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 3):
            valores = [
                int(notas_ordenadas[i].nota),
                int(notas_ordenadas[i+1].nota),
                int(notas_ordenadas[i+2].nota),
                int(notas_ordenadas[i+3].nota)
            ]
            
            if (valores[0] == 2 and valores[1] == 3 and valores[2] == 5 and valores[3] == 8) or \
            (valores[0] == 3 and valores[1] == 5 and valores[2] == 8) or \
            (valores[0] == 1 and valores[1] == 1 and valores[2] == 2 and valores[3] == 3):
                return True
        
        return False
    
    @staticmethod
    def _condicion_lucky_7(notas: List[Nota]) -> bool:
        notas_siete = [n for n in notas if int(n.nota) == 7]
        return len(notas_siete) >= 7
    
    @staticmethod
    def _condicion_perfeccion_triple(notas: List[Nota]) -> bool:
        notas_por_fecha = {}
        
        for nota in notas:
            fecha_str = nota.fecha.isoformat()
            if fecha_str not in notas_por_fecha:
                notas_por_fecha[fecha_str] = []
            notas_por_fecha[fecha_str].append(nota)
        
        for notas_dia in notas_por_fecha.values():
            dieces = [n for n in notas_dia if n.nota == 10]
            if len(dieces) >= 3:
                return True
        
        return False
    
    @staticmethod
    def _condicion_viernes_13(notas: List[Nota]) -> bool:
        for nota in notas:
            try:
                fecha = nota.fecha
                if fecha and fecha.weekday() == 4 and fecha.day == 13 and nota.nota >= 4:
                    return True
            except:
                continue
        return False
    
    @staticmethod
    def _condicion_año_nuevo(sesiones: List[SesionEstudio]) -> bool:
        for sesion in sesiones:
            try:
                fecha = sesion.fecha
                if fecha and fecha.month == 1 and fecha.day == 1:
                    return True
            except:
                continue
        return False
    
    @staticmethod
    def _condicion_navidad(sesiones: List[SesionEstudio]) -> bool:
        for sesion in sesiones:
            try:
                fecha = sesion.fecha
                if fecha and fecha.month == 12 and fecha.day == 25:
                    return True
            except:
                continue
        return False
    
    @staticmethod
    def _condicion_tu_cumpleaños(db: Session, usuario_id: str) -> bool:
        if not usuario_id:
            return False
        
        usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
        if not usuario or not usuario.fecha_nacimiento:
            return False
        
        for nota in db.query(Nota).filter(Nota.usuario_id == usuario_id).all():
            try:
                if nota.fecha and nota.fecha.month == usuario.fecha_nacimiento.month and nota.fecha.day == usuario.fecha_nacimiento.day:
                    if nota.nota >= 4:
                        return True
            except:
                continue
        
        return False
    
    @staticmethod
    def _condicion_medianoche(sesiones: List[SesionEstudio]) -> bool:
        for sesion in sesiones:
            try:
                if sesion.hora_inicio and sesion.hora_inicio.hour == 0:
                    return True
            except:
                continue
        return False
    
    @staticmethod
    def _condicion_maratonista_notas(notas: List[Nota]) -> bool:
        notas_por_fecha = {}
        
        for nota in notas:
            fecha_str = nota.fecha.isoformat()
            notas_por_fecha[fecha_str] = notas_por_fecha.get(fecha_str, 0) + 1
        
        return any(count >= 20 for count in notas_por_fecha.values())
    
    @staticmethod
    def _condicion_coleccionista_dieces(notas: List[Nota]) -> bool:
        if len(notas) < 20:
            return False
        
        return all(n.nota == 10 for n in notas)
    
    @staticmethod
    def _condicion_equilibrio_zen(notas: List[Nota]) -> bool:
        notas_validas = [n for n in notas if n.influye_promedio and n.nota >= 4]
        
        if not notas_validas:
            return False
        
        promedio = sum(n.nota for n in notas_validas) / len(notas_validas)
        
        return abs(promedio - 7.0) < 0.01
    
    @staticmethod
    def _condicion_escalera(notas: List[Nota]) -> bool:
        if len(notas) < 7:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        
        for i in range(len(notas_ordenadas) - 6):
            valores = [
                int(notas_ordenadas[i].nota),
                int(notas_ordenadas[i+1].nota),
                int(notas_ordenadas[i+2].nota),
                int(notas_ordenadas[i+3].nota),
                int(notas_ordenadas[i+4].nota),
                int(notas_ordenadas[i+5].nota),
                int(notas_ordenadas[i+6].nota)
            ]
            
            if valores == [4, 5, 6, 7, 8, 9, 10]:
                return True
        
        return False
    
    @staticmethod
    def _condicion_monotonia(notas: List[Nota]) -> bool:
        if len(notas) < 10:
            return False
        
        contador = {}
        for nota in notas:
            valor = int(nota.nota)
            contador[valor] = contador.get(valor, 0) + 1
        
        return any(count >= 10 for count in contador.values())
    
    @staticmethod
    def _condicion_primer_dia_clases(notas: List[Nota], inscripciones: List[InscripcionMateria]) -> bool:
        if not notas or not inscripciones:
            return False
        
        fechas_inscripcion = []
        for insc in inscripciones:
            if insc.fecha_inscripcion:
                try:
                    fecha = LogroService._parse_fecha(insc.fecha_inscripcion)
                    if fecha:
                        fechas_inscripcion.append(fecha)
                except:
                    continue
        
        if not fechas_inscripcion:
            return False
        
        primera_inscripcion = min(fechas_inscripcion)
        
        for nota in notas:
            try:
                fecha_nota = nota.fecha
                if fecha_nota and fecha_nota == primera_inscripcion:
                    return True
            except:
                continue
        
        return False
    
    # ===== CONDICIONES NEGATIVOS/HUMORÍSTICOS =====
    
    @staticmethod
    def _condicion_primer_tropiezo(notas: List[Nota]) -> bool:
        return any(n.nota < 4 for n in notas)
    
    @staticmethod
    def _condicion_mala_racha(notas: List[Nota]) -> bool:
        if len(notas) < 3:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        racha = 0
        
        for nota in notas_ordenadas:
            if nota.nota < 4:
                racha += 1
                if racha >= 3:
                    return True
            else:
                racha = 0
        
        return False
    
    @staticmethod
    def _condicion_procrastinador(notas: List[Nota], sesiones: List[SesionEstudio]) -> bool:
        if not sesiones:
            return False
        
        contador = 0
        
        for sesion in sesiones:
            try:
                fecha_sesion = sesion.fecha
                
                for nota in notas:
                    if nota.es_parcial or nota.es_final:
                        fecha_examen = nota.fecha
                        if fecha_examen and fecha_sesion:
                            diferencia = (fecha_examen - fecha_sesion).days
                            
                            if diferencia == 1 and nota.nota >= 4:
                                contador += 1
                                break
                
                if contador >= 5:
                    return True
            except:
                continue
        
        return False
    
    @staticmethod
    def _condicion_racha_4s(notas: List[Nota]) -> bool:
        if len(notas) < 5:
            return False
        
        notas_ordenadas = sorted(notas, key=lambda x: x.fecha)
        racha = 0
        
        for nota in notas_ordenadas:
            if abs(nota.nota - 4) < 0.1:
                racha += 1
                if racha >= 5:
                    return True
            else:
                racha = 0
        
        return False
    
    @staticmethod
    def _condicion_peor_nota(notas: List[Nota]) -> bool:
        return any(n.nota == 2 for n in notas)
    
    @staticmethod
    def _condicion_recursante(inscripciones: List[InscripcionMateria]) -> bool:
        materias_count = {}
        
        for insc in inscripciones:
            if insc.materia_id not in materias_count:
                materias_count[insc.materia_id] = 0
            materias_count[insc.materia_id] += 1
        
        return any(count > 1 for count in materias_count.values())
    
    @staticmethod
    def _condicion_casi(notas: List[Nota]) -> bool:
        casi_aprobadas = [n for n in notas if 3.5 <= n.nota < 4]
        return len(casi_aprobadas) >= 3
    
    # ===== CONDICIONES FINALES Y GRADUACIÓN =====
    
    @staticmethod
    def _condicion_ultimo_parcial(inscripciones: List[InscripcionMateria], materias: List[Materia], notas: List[Nota]) -> bool:
        materias_obligatorias = [m for m in materias if not m.es_electiva]
        todas_aprobadas = all(
            any(i.materia_id == m.id and i.estado == 'aprobada' for i in inscripciones)
            for m in materias_obligatorias
        )
        
        tiene_parciales = any(n.es_parcial for n in notas)
        
        return todas_aprobadas and tiene_parciales
    
    @staticmethod
    def _condicion_ultimo_final(inscripciones: List[InscripcionMateria], materias: List[Materia], notas: List[Nota]) -> bool:
        materias_obligatorias = [m for m in materias if not m.es_electiva]
        todas_aprobadas = all(
            any(i.materia_id == m.id and i.estado == 'aprobada' for i in inscripciones)
            for m in materias_obligatorias
        )
        
        tiene_finales = any(n.es_final for n in notas)
        
        return todas_aprobadas and tiene_finales
    
    @staticmethod
    def _condicion_todas_aprobadas(inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        return all(
            any(i.materia_id == m.id and i.estado == 'aprobada' for i in inscripciones)
            for m in materias
        )
    
    @staticmethod
    def _condicion_promedio_final_8(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        todas_aprobadas = all(
            any(i.materia_id == m.id and i.estado == 'aprobada' for i in inscripciones)
            for m in materias
        )
        
        if not todas_aprobadas:
            return False
        
        notas_validas = [n for n in notas if n.influye_promedio and n.nota >= 4]
        if not notas_validas:
            return False
        
        promedio = sum(n.nota for n in notas_validas) / len(notas_validas)
        return promedio >= 8
    
    @staticmethod
    def _condicion_promedio_final_9(notas: List[Nota], inscripciones: List[InscripcionMateria], materias: List[Materia]) -> bool:
        todas_aprobadas = all(
            any(i.materia_id == m.id and i.estado == 'aprobada' for i in inscripciones)
            for m in materias
        )
        
        if not todas_aprobadas:
            return False
        
        notas_validas = [n for n in notas if n.influye_promedio and n.nota >= 4]
        if not notas_validas:
            return False
        
        promedio = sum(n.nota for n in notas_validas) / len(notas_validas)
        return promedio >= 9
    
    # ===== FUNCIONES DE DESBLOQUEO Y VERIFICACIÓN MASIVA =====
    
    @staticmethod
    def desbloquear_logro(logro_id: str, db: Session, usuario_id: str, contexto: dict = None) -> bool:
        """
        Crea un registro de logro desbloqueado si no existe previamente.
        Soporta el guardado de datos de contexto (evidencia).
        """
        # Verificamos si ya fue desbloqueado para no duplicar
        existe = db.query(LogroDesbloqueado).filter(
            LogroDesbloqueado.logro_id == logro_id,
            LogroDesbloqueado.usuario_id == usuario_id
        ).first()
        
        if not existe:
            # Generamos un ID único y guardamos el contexto como JSON string
            nuevo_desbloqueo = LogroDesbloqueado(
                id=f"ld_{logro_id}_{usuario_id}_{int(datetime.now().timestamp())}",
                logro_id=logro_id,
                usuario_id=usuario_id,
                fecha_desbloqueo=datetime.now(),
                datos_contexto=json.dumps(contexto) if contexto else None #
            )
            db.add(nuevo_desbloqueo)
            db.commit()
            print(f"🏆 LOGRO DESBLOQUEADO: {logro_id} para el usuario {usuario_id}")
            return True
        return False
    
    @staticmethod
    def verificar_y_desbloquear_logros(db: Session, usuario_id: str = "default") -> List[str]:
        notas = db.query(Nota).filter(Nota.usuario_id == usuario_id).all()
        inscripciones = db.query(InscripcionMateria).filter(InscripcionMateria.usuario_id == usuario_id).all()
        materias = db.query(Materia).all()
        sesiones = db.query(SesionEstudio).filter(SesionEstudio.usuario_id == usuario_id).all()
        
        logros = db.query(Logro).all()
        
        logros_desbloqueados = db.query(LogroDesbloqueado.logro_id).filter(
            LogroDesbloqueado.usuario_id == usuario_id
        ).all()
        logros_desbloqueados_ids = [ld[0] for ld in logros_desbloqueados]
        
        logros_nuevos_desbloqueados = []
        
        for logro in logros:
            if logro.id in logros_desbloqueados_ids:
                continue
            
            if LogroService.verificar_logro(logro.id, notas, inscripciones, materias, sesiones, db, usuario_id):
                LogroService.desbloquear_logro(logro.id, db, usuario_id)
                logros_nuevos_desbloqueados.append(logro.id)
        
        return logros_nuevos_desbloqueados