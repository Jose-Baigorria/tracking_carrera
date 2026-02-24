import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy } from "lucide-react";

export default function ProgresoCarrera({ inscripciones, materias }) {
    // 1. Cálculos base usando los nuevos nombres de campos
    const aprobadas = inscripciones.filter(i => i.estado === 'aprobada');
    const cursando = inscripciones.filter(i => i.estado === 'cursando').length;
    const regulares = inscripciones.filter(i => i.estado === 'regular').length;
    
    // 2. Cálculo de Créditos de Electivas (Cruce por materia_id)
    const electivasAprobadas = aprobadas.filter(i => {
        const m = materias.find(mat => mat.id === i.materia_id);
        return m?.es_electiva;
    });

    const creditosObtenidos = electivasAprobadas.reduce((sum, insc) => {
        const m = materias.find(mat => mat.id === insc.materia_id);
        return sum + (m?.creditos || 0);
    }, 0);
    
    // 3. Progreso por Niveles (Dinámico por nivel del 1 al 5)
    const calcularProgresoNivel = (n) => {
        const materiasDelNivel = materias.filter(m => m.nivel === n && !m.es_electiva);
        const completadas = aprobadas.filter(i => {
            const m = materias.find(mat => mat.id === i.materia_id);
            return m?.nivel === n && !m?.es_electiva;
        });
        return {
            total: materiasDelNivel.length || 1, // Evitar división por cero
            hechas: completadas.length
        };
    };

    // Total carrera: Solo obligatorias para el porcentaje base
    const totalObligatorias = materias.filter(m => !m.es_electiva).length;
    const obligatoriasHechas = aprobadas.filter(i => {
        const m = materias.find(mat => mat.id === i.materia_id);
        return m && !m.es_electiva;
    }).length;

    // Porcentaje: (Obligatorias + Proporción de créditos electivos)
    const porcentaje = Math.round(((obligatoriasHechas + (creditosObtenidos / 20 * 7)) / (totalObligatorias + 7)) * 100);

    return (
        <Card className="bg-slate-900 border-slate-800 rounded-[2rem] overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    Progreso de Carrera
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-400 text-sm">Completado</span>
                        <span className="text-white font-bold text-lg">{porcentaje}%</span>
                    </div>
                    <Progress value={porcentaje} className="h-3 bg-slate-800" />
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/50 rounded-2xl border border-slate-800">
                    <div className="text-center">
                        <div className="text-xl font-bold text-green-400">{aprobadas.length}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Aprobadas</div>
                    </div>
                    <div className="text-center border-x border-slate-800">
                        <div className="text-xl font-bold text-blue-400">{cursando}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Cursando</div>
                    </div>
                    <div className="text-center">
                        <div className="text-xl font-bold text-amber-400">{regulares}</div>
                        <div className="text-[10px] text-slate-500 uppercase">Regulares</div>
                    </div>
                </div>

                <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((n) => {
                        const prog = calcularProgresoNivel(n);
                        return (
                            <div key={n} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-400 font-medium">Nivel {n}</span>
                                    <span className="text-slate-300 font-bold">{prog.hechas}/{prog.total}</span>
                                </div>
                                <Progress value={(prog.hechas / prog.total) * 100} className="h-2 bg-slate-800" />
                            </div>
                        );
                    })}
                    
                    <div className="space-y-1 pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-xs">
                            <span className="text-pink-500 font-bold">Electivas</span>
                            <span className="text-slate-300">{creditosObtenidos}/20 Créditos</span>
                        </div>
                        <Progress value={(creditosObtenidos / 20) * 100} className="h-2 bg-slate-800" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}