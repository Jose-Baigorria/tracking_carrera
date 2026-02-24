import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, AlertCircle, X, Loader2, Trophy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PendientesCalificacion({ notas }) {
    const queryClient = useQueryClient();
    const [editando, setEditando] = useState(null);
    const [valor, setValor] = useState("");

    const updateNota = useMutation({
        // ADAPTACIÓN: Enviamos influye_promedio: true para que la nota cuente en estadísticas
        mutationFn: ({ id, nota }) => 
            apiClient.notas.update(id, { 
                nota: parseFloat(nota),
                influye_promedio: true 
            }),
        onSuccess: (data) => {
            // Invalidamos múltiples queries para actualizar Dashboard y Estadísticas al mismo tiempo
            queryClient.invalidateQueries(['notas']);
            queryClient.invalidateQueries(['inscripciones']);
            queryClient.invalidateQueries(['dashboard-stats']);
            setEditando(null);
            setValor("");
            
            // Si el backend devolvió logros nuevos, podrías disparar un aviso aquí
            if (data.logros_desbloqueados?.length > 0) {
                console.log("¡Logros ganados!", data.logros_desbloqueados);
            }
        }
    });

    if (notas.length === 0) return null;

    return (
        <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2 text-amber-500">
                    <div className="relative">
                        <AlertCircle className="w-5 h-5 animate-pulse" />
                        <div className="absolute inset-0 bg-amber-500 blur-lg opacity-20" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em]">Pendientes de Calificación</h3>
                </div>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
                    {notas.length} EVALUACIONES
                </span>
            </div>

            <div className="grid grid-cols-1 gap-3">
                <AnimatePresence>
                    {notas.map((nota, idx) => (
                        <motion.div
                            key={nota.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className="bg-slate-900/40 border-amber-500/20 overflow-hidden relative group">
                                {/* Decoración lateral indicando estado pendiente */}
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]" />
                                
                                <div className="p-4 flex items-center justify-between gap-4">
                                    <div className="flex flex-col min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[9px] font-black text-amber-500/80 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded">
                                                {nota.tipo_evaluacion || 'Examen'}
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-medium">
                                                Finalizado el {new Date(nota.fecha).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h4 className="text-white font-bold text-sm truncate group-hover:text-amber-400 transition-colors">
                                            {nota.titulo.replace('PLANEADO: ', '')}
                                        </h4>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                        {editando === nota.id ? (
                                            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                                <Input 
                                                    type="number" 
                                                    min="0" max="10" step="0.5"
                                                    autoFocus
                                                    placeholder="0.0"
                                                    className="w-16 h-8 bg-transparent border-none text-white font-black text-center focus-visible:ring-0"
                                                    value={valor}
                                                    onChange={(e) => setValor(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && valor && updateNota.mutate({id: nota.id, nota: valor})}
                                                />
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost"
                                                    className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                                    onClick={() => valor && updateNota.mutate({id: nota.id, nota: valor})}
                                                    disabled={updateNota.isPending}
                                                >
                                                    {updateNota.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" strokeWidth={3} />}
                                                </Button>
                                                <Button 
                                                    size="icon" 
                                                    variant="ghost"
                                                    className="h-8 w-8 text-slate-500 hover:bg-slate-800"
                                                    onClick={() => setEditando(null)}
                                                >
                                                    <X className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <Button 
                                                variant="outline" 
                                                className="bg-amber-500/5 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl h-9 font-black text-[10px] tracking-widest transition-all shadow-lg shadow-amber-900/5"
                                                onClick={() => {
                                                    setEditando(nota.id);
                                                    setValor("");
                                                }}
                                            >
                                                CARGAR NOTA
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}