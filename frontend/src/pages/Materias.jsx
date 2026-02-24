import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Library, Search, Clock, BookOpen, Info, Network } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import CuadroCorrelativas from '../components/materias/CuadroCorrelativas';

export default function Materias() {
    const navigate = useNavigate();
    const [busqueda, setBusqueda] = useState('');
    const [materiaExpandida, setMateriaExpandida] = useState(null);

    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: apiClient.materias.list });
    const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: apiClient.inscripciones.list });
    // Aquí podrías cargar las correlatividades desde el back
    const { data: correlatividades = [] } = useQuery({ 
        queryKey: ['correlatividades'], 
        queryFn: () => apiClient.materias.listCorrelativas() // Asegúrate de tener esta ruta
    });

    const getEstado = (materiaId) => {
        const insc = inscripciones.find(i => i.materia_id === materiaId);
        
        // Si ya está aprobada, regular o cursando, devolvemos eso directamente
        if (insc && ['aprobada', 'regular', 'cursando'].includes(insc.estado)) {
            const config = {
                'aprobada': { label: 'APROBADA', color: 'bg-emerald-500/10 text-emerald-500', canDetail: true },
                'regular': { label: 'REGULAR', color: 'bg-amber-500/10 text-amber-500', canDetail: true },
                'cursando': { label: 'CURSANDO', color: 'bg-cyan-500/10 text-cyan-500', canDetail: true },
            };
            return config[insc.estado];
        }

        // Si no hay inscripción o está "bloqueada", calculamos si cumple correlativas
        const requisitos = correlatividades.filter(c => String(c.materia_id) === String(materiaId));
        
        // Verificamos si todas las materias requeridas como 'aprobada' están aprobadas
        const aprobadasIds = inscripciones.filter(i => i.estado === 'aprobada').map(i => i.materia_id);
        const cumpleRequisitos = requisitos.every(r => {
            if (r.tipo === 'aprobada') return aprobadasIds.includes(r.correlativa_id);
            // Puedes añadir aquí lógica para 'regular' si lo necesitas
            return true;
        });

        if (cumpleRequisitos) {
            return { label: 'DISPONIBLE', color: 'bg-blue-500/10 text-blue-400', canDetail: false };
        } else {
            return { label: 'BLOQUEADA', color: 'bg-rose-500/10 text-rose-500', icon: '🔒', canDetail: false };
        }
    };

    const MateriaRow = ({ materia }) => {
        const estado = getEstado(materia.id);
        const isExpanded = materiaExpandida === materia.id;
        const insc = inscripciones.find(i => i.materia_id === materia.id);

        return (
            <div className="mb-4">
                <div className={`p-5 bg-slate-900/60 border ${isExpanded ? 'border-cyan-500' : 'border-slate-800'} rounded-2xl transition-all`}>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge className={`${estado.color} border-none font-black text-[10px]`}>{estado.label}</Badge>
                                {/* CAMBIO: Ahora dice Obligatoria o Electiva en lugar del ID largo */}
                                <Badge className={`bg-slate-800/50 text-slate-400 border-slate-700 font-bold text-[10px]`}>
                                    {materia.es_electiva ? 'ELECTIVA' : 'OBLIGATORIA'}
                                </Badge>
                                <span className="text-[10px] font-mono text-slate-600 uppercase">{materia.codigo}</span>
                            </div>
                            <h3 className="text-xl font-bold text-white tracking-tight">{materia.nombre}</h3>
                        </div>

                        <div className="flex gap-2">
                            <Button 
                                variant="outline" 
                                size="sm"
                                className={`border-slate-700 ${isExpanded ? 'bg-cyan-600 text-white' : 'text-slate-400'}`}
                                onClick={() => setMateriaExpandida(isExpanded ? null : materia.id)}
                            >
                                <Network className="w-4 h-4 mr-2" /> Correlativas
                            </Button>
                            
                            <Button 
                                disabled={!estado.canDetail}
                                onClick={() => navigate(`/detalle?id=${insc.id}`)} // <-- USAR insc.id AQUÍ
                                className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                            >
                                <Info className="w-4 h-4 mr-2" /> Ver Detalle
                            </Button>
                        </div>
                    </div>
                    
                    <AnimatePresence>
                        {isExpanded && (
                            <CuadroCorrelativas 
                                materia={materia} 
                                todasLasMaterias={materias} 
                                correlatividades={correlatividades} 
                            />
                        )}
                    </AnimatePresence>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="space-y-4">
                        <Button asChild variant="link" className="p-0 h-auto text-slate-500 hover:text-cyan-400">
                            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/> Dashboard</Link>
                        </Button>
                        <h1 className="text-5xl font-black text-white tracking-tight flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/40">
                                <Library className="text-white h-8 w-8" />
                            </div>
                            Plan de Estudio
                        </h1>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-indigo-400" />
                        <Input 
                            placeholder="Buscar materia o código..." 
                            className="bg-slate-900/80 border-slate-800 pl-12 w-full md:w-80 h-12 rounded-2xl text-white"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                </header>

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    {/* TABS SIN FLECHAS: usando overflow-hidden y flex-1 */}
                    <Tabs defaultValue="1" className="flex-1">
                        <TabsList className="bg-slate-900/40 border border-slate-800 p-1.5 w-full rounded-[1.5rem] overflow-hidden">
                            {[1, 2, 3, 4, 5, 'E'].map(n => (
                                <TabsTrigger key={n} value={n.toString()} className="flex-1 py-3 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white font-black text-[11px] uppercase tracking-wider text-slate-500">
                                    {n === 'E' ? 'Electivas' : `${n}º Año`}
                                </TabsTrigger>
                            ))}
                        </TabsList>

                        {[1, 2, 3, 4, 5, 'E'].map(nivel => (
                            <TabsContent key={nivel} value={nivel.toString()} className="mt-8">
                                <div className="space-y-3">
                                    {materias
                                        .filter(m => nivel === 'E' ? m.es_electiva : m.nivel === parseInt(nivel) && !m.es_electiva)
                                        .filter(m => m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                                        .map(materia => (
                                            <MateriaRow key={materia.id} materia={materia} />
                                        ))}
                                </div>
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
            </div>
        </div>
    );
}