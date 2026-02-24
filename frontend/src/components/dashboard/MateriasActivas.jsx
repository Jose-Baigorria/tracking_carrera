import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, Calendar, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function MateriasActivas({ inscripciones, materias }) {
    const activas = inscripciones.filter(i => i.estado === 'cursando');
    
    const getMateriaInfo = (materiaId) => {
        return materias.find(m => m.id === materiaId);
    };
    
    return (
        <Card className="bg-slate-900 border-slate-800 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-800/50 bg-slate-900/50">
                <CardTitle className="text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-cyan-500" /> Materias en Curso
                </CardTitle>
                <Button asChild className="bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-900/20">
                    <Link to="/inscripcion"><PlusCircle className="w-4 h-4 mr-2" /> Inscribirse a Materia</Link>
                </Button>
            </CardHeader>
            <CardContent className="p-4">
                {activas.length === 0 ? (
                    <div className="text-center py-12">
                        <BookOpen className="w-12 h-12 text-slate-800 mx-auto mb-4 opacity-20" />
                        <p className="text-slate-500 italic">No tienes materias activas actualmente.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {activas.map((inscripcion, idx) => {
                            const materia = getMateriaInfo(inscripcion.materia_id);
                            if (!materia) return null;
                            
                            const progreso = inscripcion.total_clases > 0 
                                ? Math.round((inscripcion.progreso_clases / inscripcion.total_clases) * 100)
                                : 0;
                            
                            return (
                                <motion.div
                                    key={inscripcion.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                >
                                    <Link to={`/detalle?id=${inscripcion.id}`}>
                                        <div className="p-4 bg-slate-800/30 hover:bg-slate-800/60 rounded-xl transition-all border border-slate-800 hover:border-cyan-500/30 group">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-[10px] h-5" style={{borderColor: materia.color, color: materia.color}}>
                                                            Nivel {materia.nivel}
                                                        </Badge>
                                                        {materia.es_electiva && (
                                                            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-[10px] h-5">ELECTIVA</Badge>
                                                        )}
                                                    </div>
                                                    <h4 className="text-white font-bold text-base group-hover:text-cyan-400 transition-colors">
                                                        {materia.nombre}
                                                    </h4>
                                                </div>
                                                <div className="p-2 bg-slate-900 rounded-xl group-hover:bg-cyan-500 transition-colors shadow-lg">
                                                    <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-white transition-all" />
                                                </div>
                                               
                                            </div>

                                            <div className="space-y-2">
                                                 <div className="flex justify-between items-end">
                                                     <div className="flex flex-col">
                                                         <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progreso actual</span>
                                                         <span className="text-white font-bold text-sm">
                                                             {progreso}% completado
                                                         </span>
                                                     </div>
                                                     <span className="text-cyan-500 font-mono text-xs font-bold">
                                                         {inscripcion.progreso_clases} / {inscripcion.total_clases} clases
                                                     </span>
                                                 </div>
                                               <Progress value={progreso} className="h-2 bg-slate-900 border border-slate-800" />
                                             </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
