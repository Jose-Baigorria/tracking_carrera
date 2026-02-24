import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Award, Lock, Search, Sparkles, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

export default function Coleccion() {
    const [busqueda, setBusqueda] = useState('');
    
    const { data: profesores = [] } = useQuery({
        queryKey: ['profesores'],
        queryFn: () => apiClient.profesores.list()
    });
    
    const { data: materias = [] } = useQuery({
        queryKey: ['materias'],
        queryFn: () => apiClient.materias.list()
    });
    
    // CORRECCIÓN: Buscamos por 'id' (UUID) en lugar de 'numero'
    const getMateriaInfo = (materiaId) => {
        return materias.find(m => m.id === materiaId);
    };

    const profesoresFiltrados = profesores.filter(p => {
        const mat = getMateriaInfo(p.materia_id); // CORRECCIÓN: usamos p.materia_id
        const term = busqueda.toLowerCase();
        return p.nombre.toLowerCase().includes(term) || 
               mat?.nombre.toLowerCase().includes(term);
    });
    
    const desbloqueados = profesores.filter(p => p.desbloqueado).length;
    const total = profesores.length;
    
    const getRarezaStyles = (rareza) => {
        const styles = {
            comun: 'from-slate-800 to-slate-900 border-slate-700 text-slate-400',
            raro: 'from-blue-900/40 to-slate-900 border-blue-500/50 text-blue-400',
            epico: 'from-purple-900/40 to-slate-900 border-purple-500/50 text-purple-400',
            legendario: 'from-amber-900/40 to-slate-900 border-amber-500/50 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
        };
        return styles[rareza?.toLowerCase()] || styles.comun;
    };
    
    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
                    <Button asChild variant="ghost" className="mb-6 text-slate-500 hover:text-white hover:bg-white/5 p-0">
                        <Link to="/">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard
                        </Link>
                    </Button>
                    
                    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-purple-500/10 rounded-xl">
                                    <Sparkles className="w-8 h-8 text-purple-400" />
                                </div>
                                <h1 className="text-5xl font-black text-white tracking-tighter uppercase">
                                    Galería de Cátedra
                                </h1>
                            </div>
                            <p className="text-slate-500 text-lg font-medium">Colecciona a los mentores que forjan tu camino académico.</p>
                        </div>
                        
                        <div className="flex flex-col items-end gap-2">
                            <div className="bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-[2rem] border border-slate-800 shadow-2xl flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-2xl font-black text-white">{desbloqueados} / {total}</div>
                                    <div className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Profesores</div>
                                </div>
                                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                                    <Award className="w-6 h-6 text-purple-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 relative max-w-xl group">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-purple-400 transition-colors" />
                        <Input
                            placeholder="Buscar profesor o materia..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="pl-12 h-14 bg-slate-900/50 border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-purple-500/50 transition-all placeholder:text-slate-600"
                        />
                    </div>
                </motion.div>

                {/* Grid de Profesores */}
                {profesoresFiltrados.length === 0 ? (
                    <div className="text-center py-32 bg-slate-900/20 rounded-[3rem] border-2 border-dashed border-slate-800">
                        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="w-10 h-10 text-slate-700" />
                        </div>
                        <p className="text-slate-500 font-bold text-xl">No hay coincidencias en el claustro</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {profesoresFiltrados.map((profesor, idx) => {
                            const materia = getMateriaInfo(profesor.materia_id);
                            const styles = getRarezaStyles(profesor.rareza);
                            
                            return (
                                <motion.div
                                    key={profesor.id}
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    whileHover={{ y: -10 }}
                                >
                                    <Card className={`relative h-full overflow-hidden border-2 transition-all duration-500 rounded-[2.5rem] bg-gradient-to-br ${styles} group`}>
                                        {/* Efecto de Lock */}
                                        {!profesor.desbloqueado && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617]/80 z-20 backdrop-blur-sm p-6 text-center">
                                                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800 shadow-2xl">
                                                    <Lock className="w-8 h-8 text-slate-600" />
                                                </div>
                                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Inscríbete para conocerlo</p>
                                            </div>
                                        )}

                                        {/* Contenido de la Carta */}
                                        <CardContent className="p-8 flex flex-col items-center">
                                            {/* Avatar con aura de rareza */}
                                            <div className="relative mb-6">
                                                <div className={`absolute inset-0 blur-2xl opacity-20 bg-current`} />
                                                <div className="w-32 h-32 rounded-full p-1.5 bg-slate-950 border-2 border-white/5 overflow-hidden relative z-10 shadow-2xl">
                                                    {profesor.avatar_url ? (
                                                        <img src={profesor.avatar_url} alt="" className={`w-full h-full object-cover rounded-full ${!profesor.desbloqueado && 'grayscale'}`} />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-5xl font-black text-slate-700 bg-slate-900 uppercase">
                                                            {profesor.nombre[0]}
                                                        </div>
                                                    )}
                                                </div>
                                                {profesor.rareza === 'legendario' && (
                                                    <div className="absolute -top-2 -right-2 z-20 bg-amber-500 rounded-full p-1.5 shadow-lg border-2 border-slate-950">
                                                        <Star className="w-4 h-4 text-white fill-current" />
                                                    </div>
                                                )}
                                            </div>

                                            <h3 className="font-black text-xl text-white mb-2 leading-tight group-hover:text-purple-400 transition-colors">{profesor.nombre}</h3>
                                            
                                            {materia && (
                                                <div 
                                                    className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-white/10 mb-4"
                                                    style={{ backgroundColor: materia.color + '22', color: materia.color }}
                                                >
                                                    {materia.nombre}
                                                </div>
                                            )}

                                            <AnimatePresence>
                                                {profesor.desbloqueado && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, height: 0 }} 
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="space-y-4 w-full"
                                                    >
                                                        <div className="relative px-4 py-3 bg-white/5 rounded-2xl">
                                                            <span className="absolute -top-2 left-4 text-2xl text-white/10 font-serif">“</span>
                                                            <p className="text-xs text-slate-300 italic text-center line-clamp-3 leading-relaxed">
                                                                {profesor.frase || "El conocimiento es la única herramienta que no pesa."}
                                                            </p>
                                                        </div>
                                                        <div className="pt-2 border-t border-white/5">
                                                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest text-center">
                                                                {profesor.especialidad || "Titular de Cátedra"}
                                                            </p>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}