// import React, { useState } from 'react';
// import { apiClient } from '@/api/apiClient';
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import { ArrowLeft, Search, Clock, GraduationCap, Lock, CheckCircle2, BookOpen } from "lucide-react";
// import { Link } from "react-router-dom";
// import { motion, AnimatePresence } from "framer-motion";
// import { useAuth } from '@/context/AuthContext';

// export default function Inscripcion() {
//     const { user } = useAuth(); // Necesitamos el carrera_id del usuario
//     const queryClient = useQueryClient();
//     const [busqueda, setBusqueda] = useState('');
    
//     const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: apiClient.materias.list });
//     const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: apiClient.inscripciones.list });
//     const { data: correlatividades = [] } = useQuery({ queryKey: ['correlatividades'], queryFn: apiClient.materias.listCorrelativas });

//     const inscripcionMutation = useMutation({
//         mutationFn: (materia) => apiClient.inscripciones.create({
//             materia_id: materia.id,
//             materia_codigo: materia.codigo, // Corregido a los nuevos campos
//             carrera_id: user.carrera_id,      // Obligatorio ahora
//             estado: 'cursando',
//             intento: 1
//         }),
//         onSuccess: () => {
//             queryClient.invalidateQueries(['inscripciones']);
//             alert("Inscripción exitosa");
//         },
//         onError: (err) => alert(err.response?.data?.detail || "Error al inscribirse")
//     });

//     // --- MOTOR DE CÁLCULO DE ESTADOS ---
//     const getConfigEstado = (materia) => {
//         const insc = inscripciones.find(i => i.materia_id === materia.id);
        
//         // 1. Si ya tiene un estado activo
//         if (insc) {
//             if (insc.estado === 'aprobada') return { label: 'APROBADA', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', opaco: true };
//             if (insc.estado === 'cursando') return { label: 'CURSANDO', color: 'bg-slate-500/20 text-slate-400 border-slate-700', opaco: true };
//             if (insc.estado === 'regular') return { label: 'REGULAR', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', opaco: true };
//         }

//         // 2. Si no tiene inscripción, verificar correlativas
//         const requisitos = correlatividades.filter(c => c.materia_id === materia.id);
//         const aprobadasIds = inscripciones.filter(i => i.estado === 'aprobada').map(i => i.materia_id);
//         const regularesIds = inscripciones.filter(i => ['regular', 'aprobada'].includes(i.estado)).map(i => i.materia_id);

//         const cumple = requisitos.every(r => {
//             if (r.tipo === 'aprobada') return aprobadasIds.includes(r.correlativa_id);
//             if (r.tipo === 'regular') return regularesIds.includes(r.correlativa_id);
//             return true;
//         });

//         if (cumple) {
//             return { label: 'DISPONIBLE', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', canEnroll: true };
//         } else {
//             return { label: 'BLOQUEADA', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', icon: <Lock className="w-3 h-3" /> };
//         }
//     };

//     const MateriaCard = ({ materia }) => {
//         const config = getConfigEstado(materia);
//         return (
//             <motion.div
//                 layout
//                 className={`flex flex-col md:flex-row md:items-center justify-between p-5 mb-4 bg-slate-900/60 border rounded-2xl transition-all ${config.opaco ? 'opacity-50 border-slate-800' : 'border-slate-800 hover:border-slate-700'}`}
//             >
//                 <div className="flex-1">
//                     <div className="flex items-center gap-3 mb-2">
//                         <Badge className={`${config.color} border font-black text-[10px] flex gap-1 items-center`}>
//                             {config.icon} {config.label}
//                         </Badge>
//                         <Badge variant="outline" className="text-slate-600 border-slate-800 text-[10px]">
//                             {materia.es_electiva ? 'ELECTIVA' : 'OBLIGATORIA'}
//                         </Badge>
//                         <span className="text-[10px] font-mono text-slate-500">{materia.codigo}</span>
//                     </div>
//                     <h3 className="text-lg font-bold text-white">{materia.nombre}</h3>
//                 </div>

//                 <div className="mt-5 md:mt-0">
//                     {config.canEnroll ? (
//                         <Button 
//                             onClick={() => inscripcionMutation.mutate(materia)}
//                             disabled={inscripcionMutation.isPending}
//                             className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 h-11 rounded-xl shadow-lg shadow-cyan-900/20"
//                         >
//                             Inscribirme
//                         </Button>
//                     ) : (
//                         <div className="text-slate-600 text-xs font-bold uppercase tracking-widest px-4 italic">
//                             {config.label !== 'BLOQUEADA' ? 'Ya inscripto' : 'Faltan correlativas'}
//                         </div>
//                     )}
//                 </div>
//             </motion.div>
//         );
//     };

//     return (
//         <div className="min-h-screen bg-[#020617] p-6 md:p-12">
//             <div className="max-w-4xl mx-auto">
//                 <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
//                     <div className="space-y-4">
//                         <Button asChild variant="link" className="p-0 h-auto text-slate-500 hover:text-cyan-400">
//                             <Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/> Volver al Panel</Link>
//                         </Button>
//                         <h1 className="text-5xl font-black text-white tracking-tight flex items-center gap-4">
//                             <div className="p-3 bg-cyan-600 rounded-2xl shadow-xl shadow-cyan-900/40">
//                                 <GraduationCap className="text-white h-8 w-8" />
//                             </div>
//                             Inscripción
//                         </h1>
//                     </div>
//                     <div className="relative group">
//                         <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
//                         <Input 
//                             placeholder="Filtrar materias..." 
//                             className="bg-slate-900/80 border-slate-800 pl-12 w-full md:w-72 h-12 rounded-2xl text-white"
//                             value={busqueda}
//                             onChange={(e) => setBusqueda(e.target.value)}
//                         />
//                     </div>
//                 </header>

//                 <Tabs defaultValue="1" className="w-full">
//                     <TabsList className="bg-slate-900/40 border border-slate-800 p-1.5 mb-10 w-full rounded-2xl">
//                         {[1, 2, 3, 4, 5].map(n => (
//                             <TabsTrigger key={n} value={n.toString()} className="flex-1 py-3 rounded-xl data-[state=active]:bg-cyan-600 font-bold">
//                                 {n}º Año
//                             </TabsTrigger>
//                         ))}
//                     </TabsList>

//                     {[1, 2, 3, 4, 5].map(nivel => (
//                         <TabsContent key={nivel} value={nivel.toString()}>
//                             <div className="space-y-2">
//                                 {materias
//                                     .filter(m => m.nivel === nivel && m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
//                                     .map(materia => <MateriaCard key={materia.id} materia={materia} />)
//                                 }
//                             </div>
//                         </TabsContent>
//                     ))}
//                 </Tabs>
//             </div>
//         </div>
//     );
// }

import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, GraduationCap, Lock, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from '@/context/AuthContext';

export default function Inscripcion() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState('');
    
    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: apiClient.materias.list });
    const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: apiClient.inscripciones.list });
    const { data: correlatividades = [] } = useQuery({ queryKey: ['correlatividades'], queryFn: apiClient.materias.listCorrelativas });

    const inscripcionMutation = useMutation({
        mutationFn: (materia) => {
            // Buscamos si ya existe la inscripción (aunque esté bloqueada)
            const existe = inscripciones.find(i => i.materia_id === materia.id);
            if (existe) {
                // Si existe, la actualizamos a 'cursando' en lugar de crear una nueva
                return apiClient.inscripciones.update(existe.id, { estado: 'cursando' });
            }
            return apiClient.inscripciones.create({
                materia_id: materia.id,
                materia_codigo: materia.codigo,
                carrera_id: user.carrera_id,
                estado: 'cursando',
                intento: 1
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['inscripciones']);
            alert("Inscripción actualizada a CURSANDO");
        }
    });

    const getConfigEstado = (materia) => {
        const insc = inscripciones.find(i => i.materia_id === materia.id);
        
        // 1. Prioridad: Estados ya definidos en DB
        if (insc) {
            if (insc.estado === 'aprobada') return { label: 'APROBADA', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', opacity: 'opacity-50', canEnroll: false };
            if (insc.estado === 'cursando') return { label: 'CURSANDO', color: 'bg-slate-500/20 text-slate-400 border-slate-700', opacity: 'opacity-50', canEnroll: false };
            if (insc.estado === 'regular') return { label: 'REGULAR', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', opacity: 'opacity-60', canEnroll: false };
        }

        // 2. Cálculo de disponibilidad por correlativas
        const requisitos = correlatividades.filter(c => c.materia_id === materia.id);
        const aprobadasIds = inscripciones.filter(i => i.estado === 'aprobada').map(i => i.materia_id);
        
        const cumpleRequisitos = requisitos.every(r => {
            if (r.tipo === 'aprobada') return aprobadasIds.includes(r.correlativa_id);
            return true;
        });

        if (cumpleRequisitos) {
            return { label: 'DISPONIBLE', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', opacity: 'opacity-100', canEnroll: true };
        } else {
            return { label: 'BLOQUEADA', color: 'bg-rose-500/10 text-rose-500 border-rose-500/20', opacity: 'opacity-40', canEnroll: false, isLocked: true };
        }
    };

    const MateriaCard = ({ materia }) => {
        const config = getConfigEstado(materia);
        return (
            <motion.div 
                layout 
                className={`flex flex-col md:flex-row md:items-center justify-between p-5 mb-4 bg-slate-900/60 border border-slate-800 rounded-2xl transition-all ${config.opacity}`}
            >
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        {/* Estado: Aprobada, Disponible, etc. */}
                        <Badge className={`${config.color} border font-black text-[10px]`}>
                            {config.label}
                        </Badge>

                        {/* Tipo: Electiva u Obligatoria (CORREGIDO SIN //) */}
                        <Badge variant="outline" className="text-slate-600 border-slate-800 text-[10px]">
                            {materia.es_electiva ? 'ELECTIVA' : 'OBLIGATORIA'}
                        </Badge>

                        {/* Código de materia usando el nuevo modelo */}
                        <span className="text-[10px] font-mono text-slate-500">{materia.codigo}</span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white">{materia.nombre}</h3>
                </div>

                <div className="mt-4 md:mt-0">
                    {config.canEnroll ? (
                        <Button 
                            onClick={() => inscripcionMutation.mutate(materia)} 
                            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-8 rounded-xl"
                        >
                            Inscribirme
                        </Button>
                    ) : (
                        <div className="text-[10px] font-black uppercase text-slate-600 px-4">
                            {config.isLocked ? "Faltan Correlativas" : config.label}
                        </div>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-end mb-12">
                    <div className="space-y-4">
                        <Button asChild variant="link" className="p-0 h-auto text-slate-500 hover:text-cyan-400">
                            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/> Dashboard</Link>
                        </Button>
                        <h1 className="text-5xl font-black text-white tracking-tight flex items-center gap-4">
                            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-900/40">
                                <GraduationCap className="text-white h-8 w-8" /> 
                            </div>
                            Inscripciones
                        </h1>
                    </div>
                    
                    <Input 
                        placeholder="Buscar materia..." 
                        className="bg-slate-900/80 border-slate-800 w-64 rounded-xl text-white"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                    />
                </header>
                <Tabs defaultValue="1">
                    <TabsList className="bg-slate-900/40 border border-slate-800 w-full mb-8 rounded-2xl p-1">
                        {[1, 2, 3, 4, 5].map(n => <TabsTrigger key={n} value={n.toString()} className="flex-1 rounded-xl font-bold">{n}º Año</TabsTrigger>)}
                    </TabsList>
                    {[1, 2, 3, 4, 5].map(nivel => (
                        <TabsContent key={nivel} value={nivel.toString()}>
                            {materias.filter(m => m.nivel === nivel && m.nombre.toLowerCase().includes(busqueda.toLowerCase())).map(m => <MateriaCard key={m.id} materia={m} />)}
                        </TabsContent>
                    ))}
                </Tabs>
            </div>
        </div>
    );
}