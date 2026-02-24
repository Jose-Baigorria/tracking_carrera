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

export default function ModalNota({ open, onClose, onSave, inscripcionId, notaEditar = null }) {
    const [titulo, setTitulo] = useState('');
    const [nota, setNota] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [esTP, setEsTP] = useState(false);
    const [esParcial, setEsParcial] = useState(false);
    const [esFinal, setEsFinal] = useState(false);
    const [influyePromedio, setInfluyePromedio] = useState(true);
    const [observaciones, setObservaciones] = useState('');
    
    useEffect(() => {
        if (notaEditar && open) {
            setTitulo(notaEditar.titulo);
            setNota(String(notaEditar.nota));
            setFecha(notaEditar.fecha);
            setEsTP(notaEditar.es_tp || false);
            setEsParcial(notaEditar.es_parcial || false);
            setEsFinal(notaEditar.es_final || false);
            setInfluyePromedio(notaEditar.influye_promedio ?? true);
            setObservaciones(notaEditar.observaciones || '');
        } else if (open) {
            setTitulo('');
            setNota('');
            setFecha(new Date().toISOString().split('T')[0]);
            setEsTP(false);
            setEsParcial(false);
            setEsFinal(false);
            setInfluyePromedio(true);
            setObservaciones('');
        }
    }, [notaEditar, open]);
    
    const handleSubmit = () => {
        const valorNota = parseFloat(nota);
        if (!titulo || isNaN(valorNota) || valorNota < 0 || valorNota > 10) return;
        
        // Determinamos el tipo para el backend de Python
        let tipo = "otro";
        if (esTP) tipo = "tp";
        if (esParcial) tipo = "parcial";
        if (esFinal) tipo = "final";

        onSave({
            id: notaEditar?.id,
            inscripcion_id: inscripcionId, // CORRECCIÓN: UUID de inscripción
            titulo,
            nota: valorNota,
            fecha,
            tipo_evaluacion: tipo, // Requerido para lógica de Logros en Python
            es_tp: esTP,
            es_parcial: esParcial,
            es_final: esFinal,
            influye_promedio: influyePromedio,
            observaciones
        });
        
        onClose();
    };
    
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-slate-900 border-slate-800 max-w-md text-white rounded-[2rem]">
                <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tight">
                        {notaEditar ? 'Modificar Calificación' : 'Registrar Nota'}
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Descripción de la evaluación</Label>
                        <Input
                            placeholder="ej: Segundo Parcial"
                            value={titulo}
                            onChange={(e) => setTitulo(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase">Calificación (0-10)</Label>
                            <Input
                                type="number"
                                min="0" max="10" step="0.1"
                                placeholder="8.5"
                                value={nota}
                                onChange={(e) => setNota(e.target.value)}
                                className="bg-slate-800 border-slate-700 text-white font-mono text-lg"
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
                    
                    <div className="space-y-3 p-4 bg-slate-950/50 rounded-2xl border border-slate-800">
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400">Trabajo Práctico (TP)</Label>
                            <Switch checked={esTP} onCheckedChange={(c) => { setEsTP(c); if(c){setEsParcial(false); setEsFinal(false);}}} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400">Examen Parcial</Label>
                            <Switch checked={esParcial} onCheckedChange={(c) => { setEsParcial(c); if(c){setEsTP(false); setEsFinal(false);}}} />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label className="text-xs font-bold text-slate-400">Examen Final / Coloquio</Label>
                            <Switch checked={esFinal} onCheckedChange={(c) => { setEsFinal(c); if(c){setEsTP(false); setEsParcial(false);}}} />
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-800/50">
                            <Label className="text-xs font-black text-cyan-500 uppercase">¿Contar para Promedio?</Label>
                            <Switch checked={influyePromedio} onCheckedChange={setInfluyePromedio} />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase">Observaciones</Label>
                        <Textarea
                            placeholder="ej: Me faltó estudiar más la unidad 3..."
                            value={observaciones}
                            onChange={(e) => setObservaciones(e.target.value)}
                            className="bg-slate-800 border-slate-700 text-white h-20 resize-none"
                        />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-500">
                            CANCELAR
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={!titulo || !nota}
                            className="flex-1 bg-cyan-600 hover:bg-cyan-500 font-black shadow-lg shadow-cyan-900/20"
                        >
                            GUARDAR NOTA
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}