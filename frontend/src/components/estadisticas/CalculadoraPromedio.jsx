import React, { useState } from 'react';
import { motion } from "framer-motion"; 
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calculator, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function CalculadoraPromedio({ notasFinales = [], materiasCursandoDisponibles = [], materiasData = [] }) {
    const [materiasSimuladas, setMateriasSimuladas] = useState([]);
    
    const promedioActual = notasFinales.length > 0
        ? (notasFinales.reduce((sum, n) => sum + n.nota, 0) / notasFinales.length).toFixed(2)
        : "0.00";
    
    const calcularPromedioSimulado = () => {
        const notasActuales = notasFinales.map(n => n.nota);
        const notasSimuladasValidas = materiasSimuladas
            .filter(m => m.materia_id && m.nota)
            .map(m => parseFloat(m.nota));
        
        const todasNotas = [...notasActuales, ...notasSimuladasValidas];
        if (todasNotas.length === 0) return promedioActual;
        return (todasNotas.reduce((sum, n) => sum + n, 0) / todasNotas.length).toFixed(2);
    };
    
    const agregarMateria = () => {
        setMateriasSimuladas([...materiasSimuladas, { materia_id: '', nota: '' }]);
    };
    
    const actualizarMateria = (index, campo, valor) => {
        const nuevas = [...materiasSimuladas];
        nuevas[index][campo] = valor;
        setMateriasSimuladas(nuevas);
    };
    
    const eliminarMateria = (index) => {
        setMateriasSimuladas(materiasSimuladas.filter((_, i) => i !== index));
    };
    
    // FILTRO CORREGIDO: Bloquea materias aprobadas de forma absoluta
    const getMateriaDisponibles = () => {
        // Obtenemos los IDs de materias que ya tienen nota final (aprobadas)
        const idsAprobadas = notasFinales.map(n => n.materia_id);
        
        // Obtenemos los IDs de las que ya estamos simulando abajo
        const yaSimuladasIds = materiasSimuladas.map(m => m.materia_id);
        
        return materiasCursandoDisponibles.filter(m => 
            m.estado !== 'aprobada' &&                // Filtro por estado de inscripción
            !idsAprobadas.includes(m.materia_id) &&   // Filtro por existencia de nota final
            !yaSimuladasIds.includes(m.materia_id)    // Evitar duplicados en la lista de simulación
        );
    };
    
    const promedioSimulado = calcularPromedioSimulado();
    const diferencia = (parseFloat(promedioSimulado) - parseFloat(promedioActual)).toFixed(2);
    
    return (
        <Card className="bg-slate-900 border-slate-800 shadow-xl">
            <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-cyan-400" />
                    Calculadora "¿Qué pasa si...?"
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-800/50 rounded-lg border border-slate-800">
                    <div>
                        <p className="text-slate-400 text-sm">Prom. Finales Actual</p>
                        <p className="text-3xl font-bold text-white">{promedioActual}</p>
                        <p className="text-slate-500 text-xs">{notasFinales.length} finales</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Promedio Simulado</p>
                        <div className="flex items-baseline gap-2">
                            <p className="text-3xl font-bold text-cyan-400">{promedioSimulado}</p>
                            {parseFloat(diferencia) !== 0 && (
                                <Badge className={parseFloat(diferencia) > 0 ? 'bg-green-600' : 'bg-red-600'}>
                                    {parseFloat(diferencia) > 0 ? '+' : ''}{diferencia}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-slate-300">Materias a Simular</Label>
                        <Button 
                            size="sm" 
                            onClick={agregarMateria} 
                            className="bg-cyan-600 hover:bg-cyan-700"
                            disabled={getMateriaDisponibles().length === 0}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar
                        </Button>
                    </div>
                    
                    {materiasSimuladas.length === 0 ? (
                        <p className="text-slate-400 text-sm text-center py-4 italic opacity-60">
                            Selecciona materias cursando o bloqueadas para proyectar tu promedio final
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {materiasSimuladas.map((sim, idx) => {
                                const materiaInfo = materiasData.find(m => m.id === sim.materia_id);
                                return (
                                    <motion.div 
                                        key={idx} 
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="flex gap-2 bg-slate-800/30 p-2 rounded-lg"
                                    >
                                        <Select
                                            value={sim.materia_id}
                                            onValueChange={(v) => actualizarMateria(idx, 'materia_id', v)}
                                        >
                                            <SelectTrigger className="bg-slate-800 border-slate-700 text-white flex-1">
                                                <SelectValue placeholder="Seleccionar materia" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                                {getMateriaDisponibles().map(m => {
                                                    const info = materiasData.find(mat => mat.id === m.materia_id);
                                                    return (
                                                        <SelectItem key={m.id} value={m.materia_id}>
                                                            {info?.nombre || 'Materia'}
                                                        </SelectItem>
                                                    );
                                                })}
                                                {sim.materia_id && (
                                                    <SelectItem value={sim.materia_id}>
                                                        {materiaInfo?.nombre || 'Seleccionada'}
                                                    </SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        
                                        <Input
                                            type="number"
                                            min="0" max="10" step="0.1"
                                            placeholder="Nota"
                                            value={sim.nota}
                                            onChange={(e) => actualizarMateria(idx, 'nota', e.target.value)}
                                            className="bg-slate-800 border-slate-700 text-white w-24 text-center font-bold"
                                        />
                                        
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => eliminarMateria(idx)}
                                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}