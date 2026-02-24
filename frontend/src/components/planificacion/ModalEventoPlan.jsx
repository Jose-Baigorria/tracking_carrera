import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Tag, Palette, Info } from "lucide-react";

export default function ModalEventoPlan({ open, onClose, onSave, materiasDisponibles = [], eventoEditar = null }) {
    const [titulo, setTitulo] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [tipo, setTipo] = useState('parcial');
    const [materiaId, setMateriaId] = useState('');
    const [color, setColor] = useState('#f43f5e');
    const [influyePromedio, setInfluyePromedio] = useState(true);

    useEffect(() => {
        if (eventoEditar && open) {
            setTitulo(eventoEditar.titulo || '');
            setFecha(eventoEditar.fecha || '');
            setTipo(eventoEditar.tipo || 'parcial');
            setMateriaId(eventoEditar.materia_id ? String(eventoEditar.materia_id) : '');
            setColor(eventoEditar.color || '#f43f5e');
            setInfluyePromedio(eventoEditar.influye_promedio ?? true);
        } else if (open) {
            resetFields();
        }
    }, [eventoEditar, open]);

    const resetFields = () => {
        setTitulo('');
        setFecha(new Date().toISOString().split('T')[0]);
        setTipo('parcial');
        setMateriaId('');
        setColor('#f43f5e');
        setInfluyePromedio(true);
    };

    const handleSubmit = () => {
        if (!titulo || !fecha || (tipo !== 'otro' && !materiaId)) return;

        onSave({
            id: eventoEditar?.id, // Necesario para PATCH en FastAPI
            titulo,
            fecha,
            tipo,
            materia_id: tipo === 'otro' ? null : materiaId, // UUID o null
            color,
            influye_promedio: influyePromedio,
            nota: eventoEditar ? eventoEditar.nota : -1 // Mantenemos el centinela
        });
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="bg-slate-950 border-slate-800 text-white rounded-[2.5rem] p-8 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-3xl font-black uppercase tracking-tighter">
                        {eventoEditar ? 'Modificar Desafío' : 'Agendar Desafío'}
                    </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">¿Qué evento es?</Label>
                        <Input 
                            value={titulo} 
                            onChange={e => setTitulo(e.target.value)} 
                            className="bg-slate-900 border-slate-800 h-12 rounded-xl focus:ring-rose-500/20" 
                            placeholder="ej: Examen Final Análisis II" 
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categoría</Label>
                            <Select value={tipo} onValueChange={setTipo}>
                                <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    <SelectItem value="parcial">PARCIAL</SelectItem>
                                    <SelectItem value="tp">TRABAJO PRÁCTICO</SelectItem>
                                    <SelectItem value="final">FINAL / COLOQUIO</SelectItem>
                                    <SelectItem value="otro">RECORDATORIO</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fecha Límite</Label>
                            <Input type="date" value={fecha} onChange={e => setFecha(e.target.value)} className="bg-slate-900 border-slate-800 h-12 rounded-xl" />
                        </div>
                    </div>

                    {tipo !== 'otro' && (
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Materia Correspondiente</Label>
                            <Select value={materiaId} onValueChange={setMateriaId}>
                                <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-xl font-bold">
                                    <SelectValue placeholder="Seleccionar de tu cursada..." />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                    {materiasDisponibles.map(m => (
                                        <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-slate-800 rounded-lg"><Palette className="w-4 h-4 text-rose-500" /></div>
                            <Label className="text-xs font-bold text-slate-300 uppercase">Identificador Visual</Label>
                        </div>
                        <input 
                            type="color" 
                            value={color} 
                            onChange={e => setColor(e.target.value)} 
                            className="w-12 h-8 rounded-lg bg-transparent border-none cursor-pointer" 
                        />
                    </div>

                    <div className="flex items-center justify-between px-2 pt-2">
                        <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-slate-500" />
                            <Label className="text-xs font-bold text-slate-500">¿Contar en Estadísticas?</Label>
                        </div>
                        <Switch checked={influyePromedio} onCheckedChange={setInfluyePromedio} />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="ghost" onClick={onClose} className="flex-1 text-slate-500 font-bold">CANCELAR</Button>
                        <Button 
                            onClick={handleSubmit} 
                            className="flex-[2] bg-rose-600 hover:bg-rose-500 font-black h-14 rounded-2xl shadow-xl shadow-rose-900/20 uppercase tracking-widest"
                        >
                            {eventoEditar ? 'Actualizar Evento' : 'Sincronizar Agenda'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}