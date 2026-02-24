import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const TIPO_COLORES = {
    clases: "bg-blue-500/20 border-blue-500/30",
    examen: "bg-red-500/20 border-red-500/30",
    inscripcion: "bg-amber-500/20 border-amber-500/30",
    receso: "bg-green-500/20 border-green-500/30",
    inicio: "bg-cyan-500/20 border-cyan-500/30",
    importante: "bg-purple-500/20 border-purple-500/30",
};

// Estilo para el texto de eventos personales
const TEXTO_PERSONAL = {
    examen: "text-red-400 font-bold",
    clases: "text-blue-400",
    importante: "text-purple-400 font-bold"
};

export default function Calendario() {
    const [mesActual, setMesActual] = useState(new Date().getMonth());
    const [añoActual, setAñoActual] = useState(2026);
    const queryClient = useQueryClient();

    // Traemos eventos (genéricos + personales)
    const { data: eventos = [] } = useQuery({
        queryKey: ['eventos-calendario'],
        queryFn: () => apiClient.calendario.eventos()
    });

    const importarMutation = useMutation({
        mutationFn: (file) => {
            const formData = new FormData();
            formData.append('file', file);
            return apiClient.calendario.importarPDF(formData);
        },
        onSuccess: () => queryClient.invalidateQueries(['eventos-calendario'])
    });

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    const getDias = () => {
        const primerDia = new Date(añoActual, mesActual, 1).getDay();
        const ultimoDia = new Date(añoActual, mesActual + 1, 0).getDate();
        const celdas = [];
        for (let i = 0; i < primerDia; i++) celdas.push(null);
        for (let d = 1; d <= ultimoDia; d++) {
            const f = `${añoActual}-${String(mesActual+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
            celdas.push({ dia: d, fecha: f, ev: eventos.filter(e => e.fecha === f) });
        }
        return celdas;
    };

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <Button asChild variant="ghost" className="text-slate-400 hover:text-white">
                        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/> Dashboard</Link>
                    </Button>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 bg-slate-900 border border-slate-700 px-4 py-2 rounded-md cursor-pointer hover:bg-slate-800 transition-all">
                            <Upload className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs font-semibold">IMPORTAR PDF</span>
                            <input type="file" className="hidden" accept=".pdf" onChange={(e) => importarMutation.mutate(e.target.files[0])} />
                        </label>
                    </div>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800">
                        <Button variant="ghost" onClick={() => setMesActual(m => m === 0 ? 11 : m - 1)}><ChevronLeft/></Button>
                        <CardTitle className="text-2xl font-black">{meses[mesActual].toUpperCase()} {añoActual}</CardTitle>
                        <Button variant="ghost" onClick={() => setMesActual(m => m === 11 ? 0 : m + 1)}><ChevronRight/></Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-7 text-center border-b border-slate-800">
                            {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
                                <div key={d} className="py-2 text-[10px] font-bold text-slate-500">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7">
                            {getDias().map((c, i) => (
                                <div key={i} className={`h-28 border-r border-b border-slate-800 relative ${!c ? 'bg-slate-950/40' : ''}`}>
                                    {c && (
                                        <>
                                            {/* Fondo de color para eventos genéricos (PDF) */}
                                            <div className="absolute inset-0 flex flex-col">
                                                {c.ev.filter(e => !e.es_personal).map((e, idx) => (
                                                    <div key={idx} className={`flex-1 ${TIPO_COLORES[e.tipo] || 'bg-slate-800/20'}`} />
                                                ))}
                                            </div>
                                            
                                            {/* Número del día */}
                                            <span className="absolute top-2 left-2 text-xs font-bold text-slate-400 z-10">{c.dia}</span>
                                            
                                            {/* Texto para eventos personales (Parciales/Notas) */}
                                            <div className="absolute inset-x-1 bottom-2 z-10 space-y-1">
                                                {c.ev.filter(e => e.es_personal).map((e, idx) => (
                                                    <p key={idx} className={`text-[9px] leading-tight uppercase ${TEXTO_PERSONAL[e.tipo] || 'text-white'}`}>
                                                        {e.actividad}
                                                    </p>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}