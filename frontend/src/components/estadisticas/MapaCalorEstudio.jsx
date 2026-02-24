import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Clock } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function MapaCalorEstudio({ sesiones = [] }) {
    const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    // FUNCIÓN CLAVE: Parseo local para evitar que el tiempo se mueva al día anterior
    const getLocalDay = (fechaStr) => {
        if (!fechaStr) return -1;
        const [year, month, day] = fechaStr.split('-').map(Number);
        return new Date(year, month - 1, day).getDay();
    };

    // Calcular minutos por día de la semana
    const minutosPorDia = dias.map((_, idx) => {
        const sesionesDia = sesiones.filter(s => getLocalDay(s.fecha) === idx);
        return sesionesDia.reduce((sum, s) => sum + (s.duracion_minutos || 0), 0);
    });
    
    const maxMinutos = Math.max(...minutosPorDia, 60); // Mínimo 60 para que la escala no sea exagerada
    
    const getColor = (minutos) => {
        if (minutos === 0) return 'bg-slate-800/50 border-slate-800/50';
        const intensidad = minutos / maxMinutos;
        if (intensidad < 0.25) return 'bg-cyan-900/40 border-cyan-800/50 text-cyan-700';
        if (intensidad < 0.5) return 'bg-cyan-700/60 border-cyan-600/50 text-cyan-200';
        if (intensidad < 0.75) return 'bg-cyan-500/80 border-cyan-400/50 text-white';
        return 'bg-cyan-400 border-cyan-300 text-slate-950';
    };

    const formatTiempo = (totalMinutos) => {
        if (totalMinutos === 0) return "Sin actividad";
        const horas = Math.floor(totalMinutos / 60);
        const mins = totalMinutos % 60;
        if (horas === 0) return `${mins}m`;
        return `${horas}h ${mins > 0 ? mins + 'm' : ''}`;
    };

    return (
        <TooltipProvider>
            <Card className="bg-slate-900 border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
                <CardHeader className="bg-slate-900/50 border-b border-slate-800/50 p-6">
                    <CardTitle className="text-white flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
                            <span className="uppercase tracking-tight text-lg font-black">Intensidad Semanal</span>
                        </div>
                        <Clock className="w-4 h-4 text-slate-500" />
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-7 gap-2">
                        {dias.map((dia, idx) => {
                            const mins = minutosPorDia[idx];
                            return (
                                <Tooltip key={dia}>
                                    <TooltipTrigger asChild>
                                        <div className="text-center group cursor-help">
                                            <div className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-tighter group-hover:text-cyan-400 transition-colors">
                                                {dia}
                                            </div>
                                            <div 
                                                className={`h-20 rounded-2xl ${getColor(mins)} flex items-center justify-center border-2 transition-all duration-500 shadow-lg`}
                                            >
                                                <div className="text-[11px] font-black transform -rotate-12 group-hover:rotate-0 transition-transform">
                                                    {mins > 0 ? (mins >= 60 ? `${Math.floor(mins/60)}h` : `${mins}m`) : ''}
                                                </div>
                                            </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-slate-950 border-slate-800 text-white font-bold">
                                        {dia}: {formatTiempo(mins)} de estudio
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                    
                    {/* Leyenda */}
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800/50">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Nivel de Enfoque</span>
                        <div className="flex items-center gap-1.5">
                            <span className="text-[9px] text-slate-600 font-bold mr-1">MENOS</span>
                            {[0, 0.2, 0.5, 0.8, 1].map((lvl, i) => (
                                <div key={i} className={`w-3 h-3 rounded-sm ${getColor(lvl * maxMinutos)}`} />
                            ))}
                            <span className="text-[9px] text-slate-600 font-bold ml-1">MÁS</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}