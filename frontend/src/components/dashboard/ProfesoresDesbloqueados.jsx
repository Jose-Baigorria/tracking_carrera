import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Users, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function ProfesoresDesbloqueados({ profesores, materias }) {
    const desbloqueados = profesores.filter(p => p.desbloqueado).slice(0, 6);
    
    const getMateriaInfo = (materiaNumero) => {
        return materias.find(m => m.numero === materiaNumero);
    };
    
    const getColorRareza = (rareza) => {
        const colores = {
            comun: 'from-slate-700 to-slate-800',
            raro: 'from-blue-700 to-blue-800',
            epico: 'from-purple-700 to-purple-800',
            legendario: 'from-amber-600 to-orange-700'
        };
        return colores[rareza] || colores.comun;
    };
    
    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Profesores Desbloqueados
                    </CardTitle>
                    <Button asChild variant="ghost" size="sm" className="text-purple-400">
                        <Link to={createPageUrl('Coleccion')}>
                            Ver todos <ChevronRight className="w-4 h-4 ml-1" />
                        </Link>
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {desbloqueados.map((profesor, idx) => {
                        const materia = getMateriaInfo(profesor.materia_numero);
                        
                        return (
                            <motion.div
                                key={profesor.id}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                className={`
                                    bg-gradient-to-br ${getColorRareza(profesor.rareza)} 
                                    rounded-lg p-3 border-2 border-opacity-50
                                    ${profesor.rareza === 'legendario' ? 'border-amber-400' :
                                      profesor.rareza === 'epico' ? 'border-purple-500' :
                                      profesor.rareza === 'raro' ? 'border-blue-500' :
                                      'border-slate-600'}
                                `}
                            >
                                <div className="flex flex-col items-center text-center gap-2">
                                    <img 
                                        src={profesor.avatar_url} 
                                        alt={profesor.nombre}
                                        className="w-16 h-16 rounded-full bg-white/10"
                                    />
                                    <div>
                                        <h4 className="text-white font-semibold text-xs line-clamp-2">
                                            {profesor.nombre}
                                        </h4>
                                        {materia && (
                                            <p className="text-white/60 text-[10px] mt-1">
                                                {materia.nombre}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}