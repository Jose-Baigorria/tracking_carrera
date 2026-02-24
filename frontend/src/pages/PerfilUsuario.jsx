import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    ArrowLeft, Award, BookOpen, MessageSquare, 
    Star, GraduationCap, TrendingUp, ShieldCheck 
} from "lucide-react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function PerfilUsuario() {
    const { id } = useParams();
    const navigate = useNavigate();

    const { data, isLoading } = useQuery({
        queryKey: ['usuario-perfil', id],
        queryFn: () => apiClient.social.usuarios.perfil(id)
    });

    if (isLoading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-cyan-500 font-black uppercase tracking-widest animate-pulse">Analizando Registro Académico...</div>;

    const { usuario, estadisticas, logros_destacados } = data;

    return (
        <div className="min-h-screen bg-[#020617] text-white p-6 md:p-12 relative overflow-hidden">
            {/* Aura de fondo basada en el promedio */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-purple-600/10 to-transparent pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-8 text-slate-500 hover:text-white p-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Hub
                </Button>

                <header className="flex flex-col md:flex-row items-center gap-8 mb-16">
                    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Avatar className="h-40 w-40 border-4 border-slate-800 shadow-2xl">
                            <AvatarImage src={usuario.avatar_url} />
                            <AvatarFallback className="bg-slate-900 text-5xl font-black text-slate-700">
                                {usuario.nombre[0]}{usuario.apellido[0]}
                            </AvatarFallback>
                        </Avatar>
                    </motion.div>

                    <div className="flex-1 text-center md:text-left space-y-4">
                        <div className="space-y-1">
                            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
                                {usuario.nombre} <span className="text-slate-500">{usuario.apellido}</span>
                            </h1>
                            <div className="flex items-center justify-center md:justify-start gap-3">
                                <Badge className="bg-slate-800 text-slate-400 border-none font-black uppercase text-[10px] tracking-widest">
                                    {usuario.carrera || 'Ingeniería en Sistemas'}
                                </Badge>
                                <span className="text-slate-600 text-sm font-bold">Legajo: {usuario.legajo}</span>
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-3">
                            <Button className="bg-white text-black hover:bg-slate-200 font-black rounded-xl px-8" onClick={() => navigate(`/comunidad/chat/privado/${usuario.id}`)}>
                                <MessageSquare className="w-4 h-4 mr-2" /> ENVIAR MENSAJE
                            </Button>
                            <Button variant="outline" className="border-slate-800 text-slate-400 rounded-xl hover:bg-slate-900">
                                <ShieldCheck className="w-4 h-4 mr-2" /> RECOMENDAR
                            </Button>
                        </div>
                    </div>

                    <div className="bg-slate-900/60 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-md text-center min-w-[200px]">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Promedio General</p>
                        <p className="text-5xl font-black text-cyan-400 tracking-tighter">{usuario.promedio_general || '0.00'}</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    {/* Estadísticas de combate académico */}
                    <div className="space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500 px-2">Estado de Cursada</h3>
                        <div className="grid grid-cols-1 gap-4">
                            {[
                                { label: 'Aprobadas', val: estadisticas.materias_aprobadas, icon: GraduationCap, color: 'text-emerald-400' },
                                { label: 'En Curso', val: estadisticas.materias_cursando, icon: BookOpen, color: 'text-cyan-400' },
                                { label: 'Apuntes', val: estadisticas.total_apuntes_shared || 0, icon: TrendingUp, color: 'text-purple-400' }
                            ].map((stat, i) => (
                                <Card key={i} className="bg-slate-900/40 border-white/5 p-6 rounded-3xl">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-slate-800 rounded-xl"><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-500 uppercase">{stat.label}</p>
                                            <p className="text-2xl font-black text-white">{stat.val}</p>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>

                    {/* Vitrina de Logros */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Vitrina de Logros</h3>
                            <Badge variant="outline" className="text-[9px] border-slate-800 text-slate-600 font-black">{logros_destacados.length} DESBLOQUEADOS</Badge>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {logros_destacados.length > 0 ? (
                                logros_destacados.map((logro, idx) => (
                                    <motion.div 
                                        key={idx} 
                                        whileHover={{ y: -5 }}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.05 }}
                                    >
                                        <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-white/5 p-6 rounded-[2rem] text-center group hover:border-purple-500/30 transition-all h-full flex flex-col items-center justify-center">
                                            <div className="text-4xl mb-3 filter drop-shadow-[0_0_10px_rgba(168,85,247,0.4)] group-hover:scale-110 transition-transform">
                                                {logro.icono || '🏆'}
                                            </div>
                                            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-tight leading-tight">
                                                {logro.nombre}
                                            </h4>
                                        </Card>
                                    </motion.div>
                                ))
                            ) : (
                                <Card className="col-span-full bg-slate-900/20 border-2 border-dashed border-slate-800 p-12 text-center rounded-[2rem]">
                                    <p className="text-slate-600 font-bold uppercase text-xs">Sin logros públicos todavía</p>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}