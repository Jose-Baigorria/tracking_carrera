import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
    BookOpen, 
    TrendingUp, 
    Award, 
    Target, 
    Sparkles,
    BarChart3,
    Calendar,
    ShieldCheck
} from "lucide-react";
import StatsCard from '../components/dashboard/StatsCard';
import ProgresoCarrera from '../components/dashboard/ProgresoCarrera';
import MateriasActivas from '../components/dashboard/MateriasActivas';
import ProximosCheckpoints from '../components/dashboard/ProximosCheckpoints';
import ProfesoresDesbloqueados from '../components/dashboard/ProfesoresDesbloqueados';
import { motion } from "framer-motion";
import ProximosEventos from '../components/dashboard/ProximosEventos';
import PendientesCalificacion from '../components/dashboard/PendientesCalificacion';

export default function Dashboard() {
    const { user, logout } = useAuth();

    // Consultas al backend (El token se envía solo por el interceptor)
    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: apiClient.materias.list });
    const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: apiClient.inscripciones.list });
    const { data: notas = [] } = useQuery({ queryKey: ['notas'], queryFn: apiClient.notas.list });
    const { data: profesores = [] } = useQuery({ queryKey: ['profesores'], queryFn: apiClient.profesores.list });
    
    const { data: clases = [] } = useQuery({
        queryKey: ['clases'],
        queryFn: () => apiClient.clases.list() 
    });
    
    const { data: insignias = [] } = useQuery({
        queryKey: ['insignias'],
        queryFn: () => apiClient.insignias.list()
    });

    const notasPendientes = notas.filter(n => n.nota === -1);
    
   // --- Lógica de Cálculos Corregida ---
    const aprobadas = inscripciones.filter(i => i.estado === 'aprobada');
    const materiasAprobadasCount = aprobadas.length;
    const materiasCursando = inscripciones.filter(i => i.estado === 'cursando').length;
    
    // Solo materias que NO son electivas
    const totalObligatorias = materias.filter(m => !m.es_electiva).length;
    const totalCarrera = materias.length; // Incluye electivas

    // Filtrado de electivas para el contador de créditos
    const electivasAprobadas = aprobadas.filter(i => {
        const m = materias.find(mat => mat.id === i.materia_id);
        return m?.es_electiva;
    });

    const materiasObligatoriasAprobadas = materiasAprobadasCount - electivasAprobadas.length
    const creditosTotales = electivasAprobadas.reduce((sum, insc) => {
        const m = materias.find(mat => mat.id === insc.materia_id);
        return sum + (m?.creditos || 0);
    }, 0);

    // Promedios (Excluyendo notas centinela -1)
    const notasValidas = notas.filter(n => n.influye_promedio && n.nota >= 0);
    const promedioGeneral = notasValidas.length > 0
        ? (notasValidas.reduce((sum, n) => sum + n.nota, 0) / notasValidas.length).toFixed(2)
        : '0.00';
    
    const parciales = notas.filter(n => (n.es_parcial || n.es_tp) && n.influye_promedio);
    const promedioParciales = parciales.length > 0
        ? (parciales.reduce((sum, n) => sum + n.nota, 0) / parciales.length).toFixed(2)
        : '0.00';
    
    const finales = notas.filter(n => n.es_final && n.influye_promedio);
    const promedioFinales = finales.length > 0
        ? (finales.reduce((sum, n) => sum + n.nota, 0) / finales.length).toFixed(2)
        : '0.00';
    
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* HEADER REDISEÑADO: Carrera Izquierda | Usuario Derecha */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="mb-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
                >
                    {/* Lado Izquierdo: Branding y Carrera de la DB */}
                    <div className="space-y-1">
                        <h1 className="text-4xl font-black text-white flex items-center gap-3 tracking-tighter uppercase">
                            <div className="p-2 bg-cyan-500/20 rounded-xl">
                                <Sparkles className="w-8 h-8 text-cyan-400" />
                            </div>
                            Focus Studio<span className="text-cyan-500">.</span>
                        </h1>
                        <div className="flex items-center gap-2 text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] ml-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-cyan-500/50" />
                            {/* Obtenemos la carrera real del objeto user */}
                            {user?.carrera_nombre || user?.carrera || "INGENIERÍA EN SISTEMAS DE INFORMACIÓN"}
                        </div>
                    </div>

                    {/* Lado Derecho: Identidad Real (Nombre Completo + Legajo) */}
                    <div className="flex items-center gap-6 bg-slate-900/40 p-2 pl-8 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-xl group hover:border-cyan-500/20 transition-all">
                        <div className="text-right">
                            <h2 className="text-xl font-black text-white tracking-tighter uppercase leading-none">
                                Hola, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                    {user?.nombre} {user?.apellido || ''}
                                </span>
                            </h2>
                            <p className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2 flex items-center justify-end gap-2">
                                <span className="h-1 w-1 rounded-full bg-cyan-500 animate-pulse" />
                                Legajo: {user?.legajo || 'S/N'}
                            </p>
                        </div>
                        <Button 
                            onClick={logout} 
                            variant="ghost" 
                            className="bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white rounded-[1.5rem] font-black transition-all px-8 h-14 uppercase tracking-widest text-[10px]"
                        >
                            Cerrar Sesión
                        </Button>
                    </div>
                </motion.div>

                {/* NUEVA BARRA DE ACCIONES: Todo al mismo nivel */}
                <div className="flex flex-wrap gap-3 mb-10">
                    {/* Grupo 1: Académico (Gradients) */}
                    <Button asChild className="bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg shadow-blue-900/20 rounded-2xl font-bold border-none">
                        <Link to="/materias"><BookOpen className="w-4 h-4 mr-2" /> Materias</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-rose-600 to-pink-600 shadow-lg shadow-rose-900/20 rounded-2xl font-bold border-none">
                        <Link to="/plan"><Calendar className="w-4 h-4 mr-2" /> Planificar</Link>
                    </Button>
                    <Button asChild className="bg-gradient-to-r from-cyan-600 to-blue-600 shadow-lg shadow-cyan-900/20 rounded-2xl font-bold border-none">
                        <Link to="/comunidad"><Target className="w-4 h-4 mr-2" /> Comunidad</Link>
                    </Button>

                    {/* Separador visual */}
                    <div className="w-px h-10 bg-slate-800 mx-2 hidden md:block" />

                    {/* Grupo 2: Herramientas y Social (Outline) */}
                    <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold">
                        <Link to="/estadisticas"><BarChart3 className="w-4 h-4 mr-2" /> Estadísticas</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold">
                        <Link to="/coleccion"><Award className="w-4 h-4 mr-2" /> Colección</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold">
                        <Link to="/estudio"><TrendingUp className="w-4 h-4 mr-2" /> Herramientas</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold">
                        <Link to="/logros"><Sparkles className="w-4 h-4 mr-2" /> Logros</Link>
                    </Button>
                    <Button asChild variant="outline" className="border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 rounded-2xl font-bold">
                        <Link to="/comunidad/muro"><Calendar className="w-4 h-4 mr-2" /> Apuntes</Link>
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
                    <StatsCard title="Aprobadas" value={materiasObligatoriasAprobadas} subtitle={`de ${totalObligatorias} oblig.`} icon={Award} color="bg-green-500" />
                    <StatsCard title="Cursando" value={materiasCursando} subtitle="en progreso" icon={BookOpen} color="bg-blue-500" />
                    <StatsCard title="Créditos" value={creditosTotales} subtitle="de 20" icon={Award} color="bg-pink-500" />
                    <StatsCard title="Prom. General" value={promedioParciales} subtitle="parciales/TPs" icon={TrendingUp} color="bg-purple-500" />
                    <StatsCard title="Prom. Finales" value={promedioFinales} subtitle="finales" icon={TrendingUp} color="bg-amber-500" />
                    <StatsCard title="Profesores" value={profesores.filter(p => p.desbloqueado).length} subtitle={`de ${profesores.length}`} icon={Award} color="bg-cyan-500" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        {notasPendientes.length > 0 && (
                            <PendientesCalificacion notas={notasPendientes} />
                        )}
                        <MateriasActivas inscripciones={inscripciones} materias={materias} />
                        <ProfesoresDesbloqueados profesores={profesores} materias={materias} />
                        {/*<ProximosCheckpoints clases={clases} inscripciones={inscripciones} materias={materias} />*/}
                    </div>
                    <div className="space-y-3">
                        <ProgresoCarrera inscripciones={inscripciones} materias={materias} totalMaterias={totalObligatorias} />
                        <ProximosEventos />
                    </div>
                </div>

                
            </div>
        </div>
    );
}