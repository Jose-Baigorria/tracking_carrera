import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
    ArrowLeft, Plus, BookOpen, Award, CheckCircle2, 
    Flag, Calendar, TrendingUp, Trash2, Pencil, Check, X, Info
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import ModalNota from '../components/detalle/ModalNota';
import ModalClase from '../components/detalle/ModalClase';

export default function DetalleMateria() {
    const queryClient = useQueryClient();
    const [searchParams] = useSearchParams();
    const inscripcionId = searchParams.get('id');
    
    const [showModalNota, setShowModalNota] = useState(false);
    const [showModalClase, setShowModalClase] = useState(false);
    const [notaEditando, setNotaEditando] = useState(null);
    const [claseEditando, setClaseEditando] = useState(null);

    const [editandoTotal, setEditandoTotal] = useState(false);
    const [nuevoTotal, setNuevoTotal] = useState(0);
    
    // --- QUERIES ---
    const { data: inscripcion } = useQuery({
        queryKey: ['inscripcion', inscripcionId],
        queryFn: () => apiClient.inscripciones.get(inscripcionId),
        enabled: !!inscripcionId
    });
    
    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: () => apiClient.materias.list() });
    
    // CORRECCIÓN: Comparación segura de IDs
    const materia = materias.find(m => String(m.id) === String(inscripcion?.materia_id));
    
    // CORRECCIÓN: Usamos .list({ inscripcion_id }) en lugar de .filter
    const { data: clases = [] } = useQuery({
        queryKey: ['clases', inscripcionId],
        queryFn: () => apiClient.clases.list({ inscripcion_id: inscripcionId }),
        enabled: !!inscripcionId
    });
    
    const { data: notas = [] } = useQuery({
        queryKey: ['notas', inscripcionId],
        queryFn: () => apiClient.notas.list({ inscripcion_id: inscripcionId }),
        enabled: !!inscripcionId
    });
    
    // --- MUTACIONES ---
    const crearNotaMutation = useMutation({
        mutationFn: (data) => {
            if (data.id) return apiClient.notas.update(data.id, data);
            return apiClient.notas.create({ ...data, inscripcion_id: inscripcionId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['notas', inscripcionId]);
            queryClient.invalidateQueries(['dashboard-stats']);
            setShowModalNota(false);
            setNotaEditando(null);
        }
    });

    const crearClaseMutation = useMutation({
        mutationFn: (data) => {
            if (data.id) return apiClient.clases.update(data.id, data);
            // CORRECCIÓN: El backend espera 'inscripcion_id'
            return apiClient.clases.create({ ...data, inscripcion_id: inscripcionId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries(['clases', inscripcionId]);
            queryClient.invalidateQueries(['inscripcion', inscripcionId]);
            setShowModalClase(false);
            setClaseEditando(null);
        }
    });

    const cambiarEstadoMutation = useMutation({
        mutationFn: (data) => apiClient.inscripciones.update(inscripcionId, data),
        onSuccess: () => {
            queryClient.invalidateQueries(['inscripcion', inscripcionId]);
            queryClient.invalidateQueries(['inscripciones']);
        }
    });

    const editarTotalMutation = useMutation({
        mutationFn: (total) => apiClient.inscripciones.update(inscripcionId, { total_clases: parseInt(total) }),
        onSuccess: () => {
            queryClient.invalidateQueries(['inscripcion', inscripcionId]);
            setEditandoTotal(false);
        }
    });

    // --- CÁLCULOS (Excluyendo notas de planificación -1) ---
    const notasReales = Array.isArray(notas) ? notas.filter(n => n.nota >= 0) : [];

    const calcularPromedioGral = () => {
        const validas = notasReales.filter(n => n.influye_promedio);
        return validas.length ? (validas.reduce((s, n) => s + n.nota, 0) / validas.length).toFixed(2) : "0.00";
    };

    const calcularPromedioParciales = () => {
        const validas = notasReales.filter(n => (n.es_parcial || n.es_tp) && n.influye_promedio);
        return validas.length ? (validas.reduce((s, n) => s + n.nota, 0) / validas.length).toFixed(2) : "0.00";
    };

    const calcularPromedioFinales = () => {
        const validas = notasReales.filter(n => n.es_final && n.influye_promedio);
        return validas.length ? (validas.reduce((s, n) => s + n.nota, 0) / validas.length).toFixed(2) : "0.00";
    };

    if (!inscripcion || !materia) return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2 }}>
                <BookOpen className="w-10 h-10 text-cyan-500" />
            </motion.div>
            <p className="font-black tracking-widest uppercase text-xs text-slate-500">Sincronizando con el servidor...</p>
        </div>
    );

    const progreso = inscripcion.total_clases > 0 ? Math.round((inscripcion.progreso_clases / inscripcion.total_clases) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-8 text-white font-sans">
            <div className="max-w-6xl mx-auto">
                <Button asChild variant="ghost" className="mb-6 text-slate-500 hover:text-white p-0 hover:bg-transparent">
                    <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard</Link>
                </Button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <Badge className="font-black" style={{ backgroundColor: materia.color + '22', color: materia.color, border: `1px solid ${materia.color}` }}>
                                NIVEL {materia.nivel}
                            </Badge>
                            <span className="text-slate-600 font-mono text-sm tracking-tighter uppercase">{materia.codigo}</span>
                        </div>
                        <h1 className="text-5xl font-black tracking-tighter uppercase">{materia.nombre}</h1>
                        <div className="flex items-center gap-4 text-slate-500 font-bold text-xs uppercase tracking-widest">
                            <span>{materia.modalidad}</span>
                            <span className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span>{materia.carga_horaria}hs Semanales</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-2">
                        <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">Estado de cursada</Label>
                        <Select value={inscripcion.status || inscripcion.estado} onValueChange={(val) => cambiarEstadoMutation.mutate({ estado: val })}>
                            <SelectTrigger className="w-40 bg-slate-900 border-slate-800 h-11 rounded-xl font-bold">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                <SelectItem value="cursando">CURSANDO</SelectItem>
                                <SelectItem value="regular">REGULAR</SelectItem>
                                <SelectItem value="aprobada">APROBADA</SelectItem>
                                <SelectItem value="bloqueada">BLOQUEADA</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                    {[
                        { label: 'Promedio Gral', val: calcularPromedioGral(), icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                        { label: 'Clases', val: `${inscripcion.progreso_clases}/${inscripcion.total_clases}`, icon: BookOpen, color: 'text-blue-400', bg: 'bg-blue-500/10', edit: true },
                        { label: 'Parciales', val: calcularPromedioParciales(), icon: Award, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                        { label: 'Finales', val: calcularPromedioFinales(), icon: Flag, color: 'text-amber-400', bg: 'bg-amber-500/10' }
                    ].map((s, i) => (
                        <Card key={i} className="bg-slate-900/50 border-slate-800 shadow-xl rounded-2xl">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 ${s.bg} rounded-xl`}><s.icon className={`w-6 h-6 ${s.color}`} /></div>
                                    <div className="min-w-0">
                                        <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{s.label}</p>
                                        <div className="flex items-center gap-2">
                                            <p className="text-2xl font-black text-white">{s.val}</p>
                                            {s.edit && (
                                                <button onClick={() => { setNuevoTotal(inscripcion.total_clases); setEditandoTotal(true); }} className="text-slate-600 hover:text-white transition-colors">
                                                    <Pencil className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {editandoTotal && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Label className="text-cyan-500 font-black text-xs uppercase">Nuevo total de clases:</Label>
                            <Input type="number" className="w-24 bg-slate-950 border-slate-800 h-9" value={nuevoTotal} onChange={(e) => setNuevoTotal(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" onClick={() => editarTotalMutation.mutate(nuevoTotal)} className="bg-cyan-600 font-bold h-9">GUARDAR</Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditandoTotal(false)} className="h-9">CANCELAR</Button>
                        </div>
                    </motion.div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bitácora de Clases */}
                    <Card className="bg-slate-900/30 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-slate-800/50 p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                                <BookOpen className="text-cyan-500 w-5 h-5"/> Bitácora de Clases
                            </CardTitle>
                            <Button size="sm" onClick={() => { setClaseEditando(null); setShowModalClase(true); }} className="bg-cyan-600 hover:bg-cyan-500 rounded-xl font-bold">
                                <Plus className="w-4 h-4 mr-1"/> REGISTRAR
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="p-6 bg-slate-950/20 space-y-4">
                                <div className="flex justify-between items-end mb-2">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progreso del programa</span>
                                    <span className="text-cyan-400 font-mono text-sm font-bold">{progreso}%</span>
                                </div>
                                <Progress value={progreso} className="h-2 bg-slate-900" />
                            </div>
                            <div className="max-h-[500px] overflow-y-auto p-6 space-y-4">
                                {clases.length === 0 ? (
                                    <div className="text-center py-20 text-slate-600 italic">No hay clases registradas aún.</div>
                                ) : (
                                    clases.map((clase) => (
                                        <div key={clase.id} className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 hover:border-cyan-500/30 transition-all flex justify-between items-start group">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono text-slate-600">#{clase.numero_clase}</span>
                                                    <h4 className="font-bold text-slate-200 text-sm">{clase.titulo}</h4>
                                                    {clase.es_checkpoint && <Badge className="bg-rose-500/20 text-rose-500 border-none text-[8px] h-4 uppercase">{clase.tipo_checkpoint}</Badge>}
                                                </div>
                                                <p className="text-[10px] text-slate-500 flex items-center gap-1 font-bold">
                                                    <Calendar className="w-3 h-3" /> {new Date(clase.fecha).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => { setClaseEditando(clase); setShowModalClase(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"><Pencil className="w-4 h-4"/></button>
                                                <button onClick={() => { if(window.confirm('¿Eliminar esta clase?')) apiClient.clases.delete(clase.id).then(() => queryClient.invalidateQueries(['clases'])) }} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-600 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calificaciones */}
                    <Card className="bg-slate-900/30 border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <CardHeader className="border-b border-slate-800/50 p-6 flex flex-row items-center justify-between">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                                <Award className="text-amber-500 w-5 h-5"/> Calificaciones
                            </CardTitle>
                            <Button size="sm" onClick={() => { setNotaEditando(null); setShowModalNota(true); }} className="bg-amber-600 hover:bg-amber-500 rounded-xl font-bold">
                                <Plus className="w-4 h-4 mr-1"/> AGREGAR NOTA
                            </Button>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4">
                                {notas.length === 0 ? (
                                    <div className="text-center py-20 text-slate-600 italic">Sin calificaciones registradas.</div>
                                ) : (
                                    notas.map(nota => (
                                        <div key={nota.id} className={`flex justify-between items-center p-5 rounded-2xl border transition-all ${nota.nota < 0 ? 'bg-slate-900/20 border-slate-800 opacity-50 border-dashed' : 'bg-slate-900 border-slate-800 hover:border-amber-500/30'}`}>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h4 className="font-black text-slate-100 text-sm truncate uppercase tracking-tight">{nota.titulo}</h4>
                                                    {nota.es_final && <Badge className="bg-amber-500 text-slate-950 font-black text-[8px] h-4">FINAL</Badge>}
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">{new Date(nota.fecha).toLocaleDateString()}</span>
                                                    {!nota.influye_promedio && <span className="text-[9px] text-slate-600 italic font-medium">No cuenta para promedio</span>}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6 ml-4">
                                                <div className={`text-3xl font-black font-mono ${nota.nota < 0 ? 'text-slate-700' : nota.nota >= 7 ? 'text-green-500' : nota.nota >= 4 ? 'text-amber-500' : 'text-rose-500'}`}>
                                                    {nota.nota < 0 ? '--' : nota.nota}
                                                </div>
                                                <div className="flex gap-1">
                                                    <button onClick={() => { setNotaEditando(nota); setShowModalNota(true); }} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white"><Pencil className="w-4 h-4"/></button>
                                                    <button onClick={() => { if(window.confirm('¿Eliminar esta nota?')) apiClient.notas.delete(nota.id).then(() => queryClient.invalidateQueries(['notas'])) }} className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-600 hover:text-rose-500"><Trash2 className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Modales */}
            <ModalNota 
                open={showModalNota} 
                onClose={() => { setShowModalNota(false); setNotaEditando(null); }} 
                onSave={(data) => crearNotaMutation.mutate(data)} 
                inscripcionId={inscripcionId} 
                notaEditar={notaEditando} 
            />
            <ModalClase 
                open={showModalClase} 
                onClose={() => { setShowModalClase(false); setClaseEditando(null); }} 
                onSave={(data) => crearClaseMutation.mutate(data)} 
                inscripcionId={inscripcionId} 
                claseEditar={claseEditando}
                numeroClase={clases.length + 1} 
            />
        </div>
    );
}