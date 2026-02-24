import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";

export default function AnalisisCuellosBotella({ inscripciones, notas }) {
    const promedioRetencion = React.useMemo(() => {
        const tiempos = [];
        inscripciones.filter(i => i.estado === 'aprobada' && i.fecha_regularizacion).forEach(i => {
            const notaFinal = notas.find(n => n.inscripcion_id === i.id && n.es_final);
            if (notaFinal) {
                const inicio = new Date(i.fecha_regularizacion);
                const fin = new Date(notaFinal.fecha);
                const dias = (fin - inicio) / (1000 * 60 * 60 * 24);
                if (dias > 0) tiempos.push(dias);
            }
        });
        return tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : 0;
    }, [inscripciones, notas]);

    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" /> RETENCIÓN DE REGULARIDAD
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-3xl font-bold text-white">{promedioRetencion} días</div>
                <p className="text-xs text-slate-500 mt-1">Tiempo promedio desde regular a final aprobado.</p>
            </CardContent>
        </Card>
    );
}