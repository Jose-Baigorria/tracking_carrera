import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function ComparativaRendimiento({ notas = [] }) {
    const [tipo, setTipo] = useState('Cuatrimestre');
    const [periodo1, setPeriodo1] = useState('');
    const [periodo2, setPeriodo2] = useState('');

    // CORRECCIÓN: Evitar el desfase horario que cambia meses
    const getPeriodoLabel = (fechaStr, modo) => {
        if (!fechaStr) return null;
        
        // Parseo manual para asegurar hora local
        const [year, month, day] = fechaStr.split('-').map(Number);
        const año = year;
        const mes = month;

        if (modo === 'Año') return año.toString();

        // Lógica académica: 1C (Marzo-Julio) y 2C (Agosto-Febrero del año sig.)
        if (mes >= 3 && mes <= 7) return `${año}-1C`;
        if (mes >= 8) return `${año}-2C`;
        if (mes <= 2) return `${año - 1}-2C`;
        return null;
    };

    const opcionesPeriodos = useMemo(() => {
        if (!Array.isArray(notas)) return [];
        // Filtramos notas reales (no planificadas) para generar las etiquetas
        const labels = notas
            .filter(n => n.nota >= 0) 
            .map(n => getPeriodoLabel(n.fecha, tipo))
            .filter(Boolean);
        return [...new Set(labels)].sort().reverse();
    }, [notas, tipo]);

    useEffect(() => {
        if (opcionesPeriodos.length >= 1) setPeriodo1(opcionesPeriodos[0]);
        if (opcionesPeriodos.length >= 2) setPeriodo2(opcionesPeriodos[1]);
        else if (opcionesPeriodos.length === 1) setPeriodo2(opcionesPeriodos[0]);
    }, [tipo, opcionesPeriodos]);

    const calcularEstadisticas = (periodoLabel) => {
        if (!periodoLabel || !Array.isArray(notas)) return { promParciales: 0, promFinales: 0, aprobadas: 0, max: 0, min: 0 };

        // Filtramos por periodo y solo notas reales (excluyendo -1)
        const notasFiltradas = notas.filter(n => 
            n.nota >= 0 && 
            getPeriodoLabel(n.fecha, tipo) === periodoLabel
        );
        
        const parciales = notasFiltradas.filter(n => (n.es_parcial || n.es_tp) && n.influye_promedio);
        const finales = notasFiltradas.filter(n => n.es_final && n.influye_promedio);
        const aprobadas = notasFiltradas.filter(n => n.es_final && n.nota >= 4).length;
        
        const todasLasNotasValidas = notasFiltradas.map(n => n.nota);

        const promediar = (arr) => arr.length ? parseFloat((arr.reduce((s, n) => s + n.nota, 0) / arr.length).toFixed(2)) : 0;

        return {
            promParciales: promediar(parciales),
            promFinales: promediar(finales),
            aprobadas,
            max: todasLasNotasValidas.length ? Math.max(...todasLasNotasValidas) : 0,
            min: todasLasNotasValidas.length ? Math.min(...todasLasNotasValidas) : 0
        };
    };

    const s1 = calcularEstadisticas(periodo1);
    const s2 = calcularEstadisticas(periodo2);

    const Tendencia = ({ actual, anterior }) => {
        if (actual > anterior) return <TrendingUp className="w-4 h-4 text-green-400 inline ml-1" />;
        if (actual < anterior) return <TrendingDown className="w-4 h-4 text-red-400 inline ml-1" />;
        return <Minus className="w-4 h-4 text-slate-500 inline ml-1" />;
    };

    const dataGrafico = [
        { name: 'Prom. Parciales', [periodo1 || 'P1']: s1.promParciales, [periodo2 || 'P2']: s2.promParciales },
        { name: 'Prom. Finales', [periodo1 || 'P1']: s1.promFinales, [periodo2 || 'P2']: s2.promFinales },
        { name: 'Aprobadas', [periodo1 || 'P1']: s1.aprobadas, [periodo2 || 'P2']: s2.aprobadas },
    ];

    return (
        <div className="space-y-6">
            {/* Selectores */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Comparar por:</label>
                    <Select value={tipo} onValueChange={setTipo}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white border-slate-700">
                            <SelectItem value="Año">Año</SelectItem>
                            <SelectItem value="Cuatrimestre">Cuatrimestre</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Periodo A</label>
                    <Select value={periodo1} onValueChange={setPeriodo1}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white">
                            {opcionesPeriodos.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] text-slate-500 uppercase font-bold">Periodo B (Referencia)</label>
                    <Select value={periodo2} onValueChange={setPeriodo2}>
                        <SelectTrigger className="bg-slate-900 border-slate-800 text-white h-10 rounded-xl">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 text-white">
                            {opcionesPeriodos.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bloque 1 - Cian */}
                <Card className="bg-slate-900/40 border border-cyan-500/20 rounded-2xl">
                    <CardContent className="p-5 space-y-3">
                        <h4 className="text-cyan-400 font-bold text-lg">{periodo1 || 'Seleccionar...'}</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between"><span className="text-slate-400">Prom. Parciales:</span><span className="text-white font-bold">{s1.promParciales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Prom. Finales:</span><span className="text-white font-bold">{s1.promFinales.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Aprobadas:</span><span className="text-white">{s1.aprobadas}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Nota Máx:</span><span className="text-green-400 font-bold">{s1.max}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Nota Mín:</span><span className="text-red-400 font-bold">{s1.min}</span></div>
                        </div>
                    </CardContent>
                </Card>

                {/* Bloque 2 - Púrpura con Tendencias */}
                <Card className="bg-slate-900/40 border border-purple-500/20 rounded-2xl">
                    <CardContent className="p-5 space-y-3">
                        <h4 className="text-purple-400 font-bold text-lg">{periodo2 || 'Seleccionar...'}</h4>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-400">Prom. Parciales:</span>
                                <span className="text-white font-bold">{s2.promParciales.toFixed(2)} <Tendencia actual={s2.promParciales} anterior={s1.promParciales} /></span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Prom. Finales:</span>
                                <span className="text-white font-bold">{s2.promFinales.toFixed(2)} <Tendencia actual={s2.promFinales} anterior={s1.promFinales} /></span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400">Aprobadas:</span>
                                <span className="text-white">{s2.aprobadas} <Tendencia actual={s2.aprobadas} anterior={s1.aprobadas} /></span>
                            </div>
                            <div className="flex justify-between"><span className="text-slate-400">Nota Máx:</span><span className="text-green-400 font-bold">{s2.max}</span></div>
                            <div className="flex justify-between"><span className="text-slate-400">Nota Mín:</span><span className="text-red-400 font-bold">{s2.min}</span></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Gráfico de Barras con altura fija para evitar error Recharts */}
            <div className="h-[300px] w-full bg-slate-900/20 rounded-2xl p-4 border border-slate-800 shadow-inner">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dataGrafico} barGap={12} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 10]} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }} />
                        <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                        <Bar dataKey={periodo1} fill="#06b6d4" radius={[6, 6, 0, 0]} barSize={40} />
                        <Bar dataKey={periodo2} fill="#a855f7" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}