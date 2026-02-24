import React, { useState, useMemo } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, BarChart3, Activity, Zap, Clock, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

import CalculadoraPromedio from '../components/estadisticas/CalculadoraPromedio';
import ComparativaRendimiento from '../components/estadisticas/ComparativaRendimiento';
import MapaCalorEstudio from '../components/estadisticas/MapaCalorEstudio';
import RendimientoCategorias from '../components/estadisticas/RendimientoCategorias';

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export default function Estadisticas() {
    const [vistaRendimiento, setVistaRendimiento] = useState('dia');

    const { data: notas = [] } = useQuery({ queryKey: ['notas'], queryFn: () => apiClient.notas.list() });
    const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: () => apiClient.inscripciones.list() });
    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: () => apiClient.materias.list() });
    const { data: sesiones = [] } = useQuery({ queryKey: ['sesiones'], queryFn: () => apiClient.sesiones.list() });

    // Función para parseo seguro de fechas locales
    const parseSafeDate = (dateStr) => {
        if (!dateStr) return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // --- 1. LÓGICA FRECUENCIA DE NOTAS ---
    const dataFrecuencia = useMemo(() => {
        const notasReales = notas.filter(n => n.nota >= 0);
        return Array.from({ length: 10 }, (_, i) => ({
            nota: i + 1,
            cantidad: notasReales.filter(n => Math.round(n.nota) === i + 1).length
        }));
    }, [notas]);

    // --- 2. LÓGICA RENDIMIENTO TEMPORAL ---
    const dataTemporal = useMemo(() => {
        const agrupar = {};
        notas.filter(n => n.nota >= 0).forEach(n => {
            const d = parseSafeDate(n.fecha);
            if (!d) return;
            let key = "";
            if (vistaRendimiento === 'dia') {
                const dayIdx = d.getDay() === 0 ? 6 : d.getDay() - 1;
                key = DIAS_SEMANA[dayIdx];
            } else if (vistaRendimiento === 'mes') {
                key = MESES[d.getMonth()];
            } else {
                key = d.getFullYear().toString();
            }
            if (!agrupar[key]) agrupar[key] = { suma: 0, cant: 0 };
            agrupar[key].suma += n.nota;
            agrupar[key].cant++;
        });
        const orden = vistaRendimiento === 'dia' ? DIAS_SEMANA : vistaRendimiento === 'mes' ? MESES : null;
        const base = orden ? orden : Object.keys(agrupar).sort();
        return base.map(name => ({
            name,
            promedio: agrupar[name] ? parseFloat((agrupar[name].suma / agrupar[name].cant).toFixed(2)) : 0
        }));
    }, [notas, vistaRendimiento]);

    // --- 3. LÓGICA TURNOS DE EXAMEN (Con detección de AD) ---
    const dataTurnos = useMemo(() => {
        const turnos = { 'Feb/Mar': { s: 0, c: 0 }, 'Julio': { s: 0, c: 0 }, 'Dic': { s: 0, c: 0 } };
        
        // Filtramos notas finales reales que NO sean aprobación directa (tienen fecha de regularización previa)
        notas.filter(n => n.es_final && n.nota >= 0).forEach(n => {
            const insc = inscripciones.find(i => i.id === n.inscripcion_id);
            // Si no hay fecha de regularización o es igual a la de aprobación, es AD y no va a los turnos
            if (!insc || !insc.fecha_regularizacion || insc.fecha_regularizacion === insc.fecha_aprobacion) return;
            
            const mes = parseSafeDate(n.fecha).getMonth() + 1;
            if (mes === 2 || mes === 3) { turnos['Feb/Mar'].s += n.nota; turnos['Feb/Mar'].c++; }
            else if (mes === 7) { turnos['Julio'].s += n.nota; turnos['Julio'].c++; }
            else if (mes === 12) { turnos['Dic'].s += n.nota; turnos['Dic'].c++; }
        });
        
        return Object.entries(turnos)
            .map(([name, v]) => ({ name, promedio: v.c ? parseFloat((v.s / v.c).toFixed(2)) : 0 }))
            .filter(t => t.promedio > 0);
    }, [notas, inscripciones]);

    // --- 4. LÓGICA EVOLUCIÓN PROMEDIO ---
    const dataEvolucion = useMemo(() => {
        const notasOrdenadas = [...notas]
            .filter(n => n.influye_promedio && n.nota >= 0)
            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha));
        let suma = 0;
        return notasOrdenadas.map((n, i) => {
            suma += n.nota;
            return {
                fechaLabel: parseSafeDate(n.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }),
                promedio: parseFloat((suma / (i + 1)).toFixed(2))
            };
        }).slice(-15);
    }, [notas]);

    // --- 5. LÓGICA RETENCIÓN DE REGULARIDAD (NUEVA) ---
    const statsRetencion = useMemo(() => {
        const aprobadas = inscripciones.filter(i => 
            i.estado === 'aprobada' && i.fecha_regularizacion && i.fecha_aprobacion
        );

        if (aprobadas.length === 0) return "--- Dias (Probablemente todas AD)";

        const diasTotales = aprobadas.reduce((acc, i) => {
            const inicio = parseSafeDate(i.fecha_regularizacion);
            const fin = parseSafeDate(i.fecha_aprobacion);
            const diff = (fin - inicio) / (1000 * 60 * 60 * 24);
            return acc + Math.max(0, diff);
        }, 0);

        const promedio = diasTotales / aprobadas.length;
        
        // Si el promedio es 0, significa que todas fueron AD
        return promedio < 1 ? "AD ✨" : `${Math.round(promedio)} días`;
    }, [inscripciones]);

    const consistencia = useMemo(() => {
        const validas = notas.filter(n => n.influye_promedio && n.nota >= 0).map(n => n.nota);
        if (validas.length < 2) return { desviacion: '0.00', racha: 0 };
        const media = validas.reduce((a, b) => a + b, 0) / validas.length;
        const varianza = validas.reduce((a, b) => a + Math.pow(b - media, 2), 0) / validas.length;
        let racha = 0;
        const crono = [...notas].filter(n => n.nota >= 0).sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
        for (let n of crono) { if (n.nota >= 4) racha++; else break; }
        return { desviacion: Math.sqrt(varianza).toFixed(2), racha };
    }, [notas]);

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 text-white font-sans">
            <div className="max-w-7xl mx-auto">
                <header className="mb-8">
                    <Button asChild variant="ghost" className="text-slate-400 mb-4 p-0 hover:text-white">
                        <Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/> Dashboard</Link>
                    </Button>
                    <h1 className="text-4xl font-black flex items-center gap-3 tracking-tighter">
                        <Activity className="text-cyan-400 w-10 h-10" /> ESTADÍSTICAS
                    </h1>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-1"><CardTitle className="text-[10px] text-slate-500 uppercase tracking-widest">Racha Actual</CardTitle></CardHeader>
                        <CardContent><div className="text-3xl font-bold text-yellow-500">{consistencia.racha} 🔥</div></CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-1"><CardTitle className="text-[10px] text-slate-500 uppercase tracking-widest">Desviación</CardTitle></CardHeader>
                        <CardContent><div className="text-3xl font-bold">{consistencia.desviacion}</div></CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800 md:col-span-2">
                        <CardHeader className="pb-1">
                            <CardTitle className="text-[10px] text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-3 h-3 text-cyan-400"/> Retención de Regularidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-cyan-400">{statsRetencion}</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
                        <CardHeader><CardTitle className="text-xs text-slate-500 uppercase">Frecuencia de Notas (1 a 10)</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={dataFrecuencia}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="nota" stroke="#64748b" />
                                        <YAxis stroke="#64748b" />
                                        <Tooltip 
                                            cursor={{fill: '#1e293b', opacity: 0.4}}
                                            contentStyle={{backgroundColor:'#0f172a', border: '1px solid #334155', borderRadius: '8px'}}
                                            itemStyle={{color: '#22d3ee', fontWeight: 'bold'}}
                                            labelStyle={{color: '#94a3b8'}}
                                            labelFormatter={(value) => `Nota: ${value}`}
                                        />
                                        <Bar name="Cantidad" dataKey="cantidad" fill="#22d3ee" radius={[4,4,0,0]} barSize={25} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-xs text-slate-500 uppercase">Rendimiento por Categoría</CardTitle></CardHeader>
                        <CardContent>
                            <RendimientoCategorias materias={materias} notas={notas} inscripciones={inscripciones} />
                        </CardContent>
                    </Card>
                </div>

                <Card className="bg-slate-900 border-slate-800 mb-6">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-xs text-slate-500 uppercase flex items-center gap-2">
                            <CalendarIcon className="w-3 h-3"/> Promedio por {vistaRendimiento}
                        </CardTitle>
                        <Select value={vistaRendimiento} onValueChange={setVistaRendimiento}>
                            <SelectTrigger className="w-24 h-8 bg-slate-800 border-slate-700 text-xs text-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-800 text-white border-slate-700">
                                <SelectItem value="dia">Día</SelectItem>
                                <SelectItem value="mes">Mes</SelectItem>
                                <SelectItem value="año">Año</SelectItem>
                            </SelectContent>
                        </Select>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dataTemporal}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                    <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                                    <YAxis domain={[0, 10]} stroke="#64748b" fontSize={11} />
                                    <Tooltip 
                                        contentStyle={{backgroundColor:'#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} 
                                        itemStyle={{color: '#f43f5e', fontWeight: 'bold'}} 
                                    />
                                    <Bar name="Promedio" dataKey="promedio" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-xs text-slate-500 uppercase">Evolución Promedio Histórica</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={dataEvolucion}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="fechaLabel" stroke="#64748b" fontSize={10} />
                                        <YAxis domain={[0, 10]} ticks={[0,2,4,6,8,10]} stroke="#64748b" fontSize={10} />
                                        <Tooltip contentStyle={{backgroundColor:'#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
                                        <Line type="monotone" dataKey="promedio" stroke="#10b981" strokeWidth={4} dot={{fill:'#10b981'}} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader><CardTitle className="text-xs text-slate-500 uppercase">Rendimiento por Turno de Examen</CardTitle></CardHeader>
                        <CardContent>
                            <div className="h-[250px] w-full">
                                {dataTurnos.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={dataTurnos}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis dataKey="name" stroke="#64748b" />
                                            <YAxis domain={[0, 10]} stroke="#64748b" />
                                            <Tooltip contentStyle={{backgroundColor:'#0f172a', border: '1px solid #1e293b', borderRadius: '8px'}} />
                                            <Bar name="Promedio" dataKey="promedio" fill="#f43f5e" radius={[4,4,0,0]} barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center space-y-2 p-4 text-slate-500 italic">
                                        <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
                                        <p className="text-sm">¡Probablemente por racha de Aprobación Directa! ✨</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="mb-6"><ComparativaRendimiento notas={notas} /></div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <CalculadoraPromedio 
                        notasFinales={notas.filter(n => n.es_final && n.nota >= 0)} 
                        materiasCursandoDisponibles={inscripciones.filter(i => i.estado !== 'aprobada')}
                        materiasData={materias}
                    />
                    <MapaCalorEstudio sesiones={sesiones} />
                </div>
            </div>
        </div>
    );
}