import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { UserCheck, Star } from "lucide-react";

export default function ModalClase({ open, onClose, onSave, inscripcionId, numeroClase, claseEditar = null }) {
    const [titulo, setTitulo] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [resumen, setResumen] = useState('');
    const [esCheckpoint, setEsCheckpoint] = useState(false);
    const [tipoCheckpoint, setTipoCheckpoint] = useState('');
    const [asistio, setAsistio] = useState(true);
    const [participacion, setParticipacion] = useState("3"); // 1-5 estrellas

    useEffect(() => {
        if (claseEditar && open) {
            setTitulo(claseEditar.titulo || '');
            setFecha(claseEditar.fecha || new Date().toISOString().split('T')[0]);
            setResumen(claseEditar.resumen || '');
            setEsCheckpoint(claseEditar.es_checkpoint || false);
            setTipoCheckpoint(claseEditar.tipo_checkpoint || '');
            setAsistio(claseEditar.asistio ?? true);
            setParticipacion(String(claseEditar.participacion || 3));
        } else if (open) {
            setTitulo('');
            setFecha(new Date().toISOString().split('T')[0]);
            setResumen('');
            setEsCheckpoint(false);
            setTipoCheckpoint('');
            setAsistio(true);
            setParticipacion("3");
        }
    }, [claseEditar, open]);
    
    const handleSubmit = () => {
        if (!titulo || !fecha) return;
        
        onSave({
            id: claseEditar?.id,
            inscripcion_id: inscripcionId, // CORRECCIÓN: Nombre de campo según backend
            numero_clase: claseEditar ? claseEditar.numero_clase : numeroClase,
            titulo,
            fecha,
            resumen,
            asistio,
            participacion: parseInt(participacion),
            es_checkpoint: esCheckpoint,
            tipo_checkpoint: esCheckpoint ? tipoCheckpoint : null,
            completada: true
        });
        
        onClose();
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-lg text-white rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                        {claseEditar ? `Editar Clase #${claseEditar.numero_clase}` : `Bitácora Clase #${numeroClase}`}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase">Título de la clase</Label>
                            <Input
                                placeholder="ej: Derivadas e Integrales"
                                value={titulo}
                                onChange={(e) => setTitulo(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase">Fecha</Label>
                            <Input
                                type="date"
                                value={fecha}
                                onChange={(e) => setFecha(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                    </div>
                    
                    {/* Nuevos campos de Asistencia y Participación */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between px-2">
                            <Label className="text-xs font-bold text-slate-400">¿Asistí?</Label>
                            <Switch checked={asistio} onCheckedChange={setAsistio} />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-[9px] font-black text-slate-600 uppercase">Participación (1-5)</Label>
                            <Select value={participacion} onValueChange={setParticipacion}>
                                <SelectTrigger className="h-8 bg-slate-900 border-slate-800">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-800 text-white">
                                    {[1,2,3,4,5].map(v => <SelectItem key={v} value={String(v)}>{v} Estrellas</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Resumen de Contenidos (mín 100 caracteres)</Label>
                        <Textarea
                            placeholder="¿Qué temas se explicaron hoy? Esto ayudará a generar tus logros de disciplina..."
                            value={resumen}
                            onChange={(e) => setResumen(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white h-32 resize-none"
                        />
                        <div className="text-right text-[10px] font-mono">
                            <span className={resumen.length < 100 ? 'text-rose-500' : 'text-cyan-500'}>
                                {resumen.length}/100
                            </span>
                        </div>
                    </div>
                    
                    <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-300">Marcar como Checkpoint (Evaluación)</Label>
                            <Switch checked={esCheckpoint} onCheckedChange={setEsCheckpoint} />
                        </div>
                        {esCheckpoint && (
                            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
                                <Select value={tipoCheckpoint} onValueChange={setTipoCheckpoint}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                                        <SelectValue placeholder="Tipo de evaluación..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                        <SelectItem value="parcial">Examen Parcial</SelectItem>
                                        <SelectItem value="final">Examen Final</SelectItem>
                                        <SelectItem value="recuperatorio">Recuperatorio</SelectItem>
                                    </SelectContent>
                                </Select>
                            </motion.div>
                        )}
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-500 hover:text-white">
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!titulo || !fecha || resumen.length < 100}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 font-black"
                        >
                            GUARDAR BITÁCORA
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}