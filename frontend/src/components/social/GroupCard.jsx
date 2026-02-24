import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

export default function GroupCard({ grupo, mine }) {
    // Generamos avatares simbólicos basados en el conteo real del backend
    const dummyMembers = Array.from({ length: Math.min(grupo.integrantes_actuales, 3) });

    return (
        <Card className="bg-slate-900/60 border-slate-800 hover:border-purple-500/40 p-6 rounded-[2.5rem] transition-all relative overflow-hidden group border-2">
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-purple-600/20 rounded-2xl flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform shadow-lg shadow-purple-900/20">
                        <Users className="h-6 w-6" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight leading-none mb-1">{grupo.nombre}</h4>
                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{grupo.materia_nombre || 'General'}</p>
                    </div>
                </div>
                {/* El punto de actividad ahora es dinámico si el grupo está activo */}
                {grupo.activo && (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.8)] animate-pulse" />
                )}
            </div>

            <div className="flex items-center gap-6 mb-6">
                <div className="flex -space-x-3">
                    {dummyMembers.map((_, i) => (
                        <div key={i} className="h-9 w-9 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 uppercase">
                            U{i+1}
                        </div>
                    ))}
                    {grupo.integrantes_actuales > 3 && (
                        <div className="h-9 w-9 rounded-full border-2 border-slate-900 bg-purple-600 flex items-center justify-center text-[10px] font-black text-white shadow-xl">
                            +{grupo.integrantes_actuales - 3}
                        </div>
                    )}
                </div>
                
                {/* Mensajes reales: Si no hay nuevos, ocultamos o mostramos '0' */}
                <div className="flex items-center gap-2 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{grupo.mensajes_hoy || 0} NUEVOS</span>
                </div>
            </div>

            <Button asChild className={`w-full h-14 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${mine ? 'bg-white text-black hover:bg-slate-200' : 'bg-slate-800 text-white hover:bg-purple-600 shadow-2xl'}`}>
                <Link to={`/comunidad/group/${grupo.id}`}>
                    {mine ? 'ENTRAR AL CANAL' : 'UNIRSE AL EQUIPO'} <ArrowRight className="ml-2 w-4 h-4" strokeWidth={3} />
                </Link>
            </Button>
        </Card>
    );
}