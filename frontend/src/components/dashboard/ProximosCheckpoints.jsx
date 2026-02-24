import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Flag, Calendar, Clock } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function ProximosCheckpoints({ clases, inscripciones, materias }) {
    const checkpoints = clases
        .filter(c => c.es_checkpoint && c.fecha && new Date(c.fecha) >= new Date())
        .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
        .slice(0, 5);
    
    const getMateriaInfo = (inscripcionId) => {
        const inscripcion = inscripciones.find(i => i.id === inscripcionId);
        if (!inscripcion) return null;
        return materias.find(m => m.numero === inscripcion.materia_numero);
    };
    
    const getDiasRestantes = (fecha) => {
        return differenceInDays(new Date(fecha), new Date());
    };
    
    const getColorPorUrgencia = (dias) => {
        if (dias <= 3) return 'text-red-400 bg-red-400/10 border-red-400/20';
        if (dias <= 7) return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
        return 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20';
    };
    
    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Flag className="w-5 h-5 text-red-500" />
                    Próximos Checkpoints
                </CardTitle>
            </CardHeader>
            <CardContent>
                {checkpoints.length === 0 ? (
                    <div className="text-center py-8">
                        <Flag className="w-12 h-12 text-slate-700 mx-auto mb-3" />
                        <p className="text-slate-400">No hay checkpoints programados</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {checkpoints.map((checkpoint, idx) => {
                            const materia = getMateriaInfo(checkpoint.inscripcion_materia_id);
                            if (!materia) return null;
                            
                            const diasRestantes = getDiasRestantes(checkpoint.fecha);
                            
                            return (
                                <motion.div
                                    key={checkpoint.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="flex-1">
                                            <Badge 
                                                variant="outline" 
                                                className="mb-2 text-xs"
                                                style={{borderColor: materia.color, color: materia.color}}
                                            >
                                                {materia.nombre}
                                            </Badge>
                                            <h4 className="text-white font-semibold text-sm">
                                                {checkpoint.titulo}
                                            </h4>
                                        </div>
                                        <Badge className={`${getColorPorUrgencia(diasRestantes)} border`}>
                                            {diasRestantes === 0 ? 'HOY' : `${diasRestantes}d`}
                                        </Badge>
                                    </div>
                                    
                                    <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(checkpoint.fecha), "dd MMM yyyy", { locale: es })}
                                        </span>
                                        <Badge variant="outline" className="text-xs">
                                            {checkpoint.tipo_checkpoint}
                                        </Badge>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}