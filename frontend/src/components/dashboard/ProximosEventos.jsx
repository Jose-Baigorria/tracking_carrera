// import React from 'react';
// import { useQuery } from '@tanstack/react-query';
// import { apiClient } from '@/api/apiClient';
// import { Card, CardContent } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { CalendarDays, Clock } from "lucide-react";
// import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
// import { es } from 'date-fns/locale';

// export default function ProximosEventos() {
//     const { data: eventos = [] } = useQuery({
//         queryKey: ['planificacion'],
//         queryFn: () => apiClient.planificacion.list()
//     });

//     const hoy = startOfDay(new Date());
//     const limite = addDays(hoy, 14); // Próximos 14 días

//     const eventosFiltrados = eventos
//         .filter(ev => {
//             const fechaEv = new Date(ev.fecha);
//             return isAfter(fechaEv, hoy) || fechaEv.getTime() === hoy.getTime();
//         })
//         .filter(ev => isBefore(new Date(ev.fecha), limite))
//         .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

//     return (
//         <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
//             <div className="p-4 border-b border-slate-800 bg-slate-900/80 flex items-center gap-2">
//                 <CalendarDays className="w-4 h-4 text-rose-400" />
//                 <h3 className="text-sm font-bold text-white uppercase tracking-wider">Próximos Eventos</h3>
//             </div>
//             <CardContent className="p-0">
//                 {eventosFiltrados.length === 0 ? (
//                     <p className="p-8 text-center text-slate-500 text-sm italic">No hay eventos cercanos</p>
//                 ) : (
//                     <div className="divide-y divide-slate-800/50">
//                         {eventosFiltrados.map((ev) => (
//                             <div key={ev.id} className="p-4 hover:bg-white/5 transition-colors flex items-center justify-between group">
//                                 <div className="flex flex-col gap-1">
//                                     <span className="text-xs font-black text-slate-500 uppercase tracking-tighter">
//                                         {format(new Date(ev.fecha), "eeee dd 'de' MMMM", { locale: es })}
//                                     </span>
//                                     <span className="text-white font-bold group-hover:text-rose-400 transition-colors">{ev.titulo}</span>
//                                 </div>
//                                 <Badge className="bg-slate-800 text-slate-300 border-none uppercase text-[10px]">
//                                     {ev.tipo}
//                                 </Badge>
//                             </div>
//                         ))}
//                     </div>
//                 )}
//             </CardContent>
//         </Card>
//     );
// }

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ChevronRight } from "lucide-react";
import { format, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ProximosEventos() {
    const { data: eventos = [] } = useQuery({
        queryKey: ['planificacion'],
        queryFn: () => apiClient.planificacion.list()
    });

    // FUNCIÓN CLAVE: Evita el error del día anterior
    const parseLocalDate = (dateStr) => {
        if (!dateStr) return new Date();
        // Split manual para ignorar la zona horaria del navegador
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const hoy = startOfDay(new Date());
    const limite = addDays(hoy, 14); 

    const eventosFiltrados = eventos
        .filter(ev => {
            const fechaEv = parseLocalDate(ev.fecha);
            return isAfter(fechaEv, hoy) || fechaEv.getTime() === hoy.getTime();
        })
        .filter(ev => isBefore(parseLocalDate(ev.fecha), limite))
        .sort((a, b) => parseLocalDate(a.fecha) - parseLocalDate(b.fecha));

    const getBadgeColor = (tipo) => {
        const colors = {
            'final': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
            'parcial': 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
            'tp': 'bg-amber-500/10 text-amber-500 border-amber-500/20'
        };
        return colors[tipo?.toLowerCase()] || 'bg-slate-800 text-slate-400';
    };

    return (
        <Card className="bg-slate-900/40 border-slate-800 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-2xl">
            <div className="p-6 border-b border-slate-800/50 bg-slate-900/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/10 rounded-lg">
                        <CalendarDays className="w-5 h-5 text-rose-500" />
                    </div>
                    <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Próximos Eventos</h3>
                </div>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-500">
                    SIGUIENTES 14 DÍAS
                </Badge>
            </div>
            
            <CardContent className="p-0">
                {eventosFiltrados.length === 0 ? (
                    <div className="p-12 text-center space-y-2">
                        <div className="w-12 h-12 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="w-6 h-6 text-slate-600" />
                        </div>
                        <p className="text-slate-500 text-sm font-medium italic">Sin eventos próximos</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/30">
                        {eventosFiltrados.map((ev) => {
                            const fechaLocal = parseLocalDate(ev.fecha);
                            return (
                                <div key={ev.id} className="p-5 hover:bg-white/[0.02] transition-all flex items-center justify-between group cursor-default">
                                    <div className="flex flex-col gap-1.5">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest">
                                                {format(fechaLocal, "eee dd 'de' MMMM", { locale: es })}
                                            </span>
                                            {fechaLocal.getTime() === hoy.getTime() && (
                                                <Badge className="bg-rose-600 text-white text-[8px] h-4 px-1.5 animate-pulse border-none">HOY</Badge>
                                            )}
                                        </div>
                                        <span className="text-white font-bold text-sm group-hover:text-rose-400 transition-colors leading-tight">
                                            {ev.titulo}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Badge className="bg-slate-800 text-slate-300 border-none uppercase text-[10px]">
                                                {ev.tipo}
                                         </Badge>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}