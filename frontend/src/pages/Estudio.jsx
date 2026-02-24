import React, { useState } from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, Brain, Sparkles, Folder,
    Zap, Clock, Search, Layers, Lightbulb, TrendingUp, Star
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Pomodoro from '../components/estudio/Pomodoro';
import FlashCards from '../components/estudio/FlashCards';
import AmbienteSonoro from '../components/estudio/AmbienteSonoro';

const INSIGHTS = [
    { title: "Técnica Pomodoro", desc: "El foco máximo dura 25-30 min.", icon: <Clock className="text-cyan-400 w-5 h-5" /> },
    { title: "Efecto Spacing", desc: "Repasar 24hs después reduce el olvido.", icon: <Brain className="text-purple-400 w-5 h-5" /> },
    { title: "Curva del Olvido", desc: "En 48hs pierdes el 70% de lo nuevo.", icon: <TrendingUp className="text-rose-400 w-5 h-5" /> }
];

export default function Estudio() {
    const queryClient = useQueryClient();
    const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
    const [busqueda, setBusqueda] = useState("");
    const [showModalFlashcard, setShowModalFlashcard] = useState(false);
    const [nuevaFlashcard, setNuevaFlashcard] = useState({ pregunta: '', respuesta: '', materia_id: '' });

    const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: () => apiClient.inscripciones.list() });
    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: () => apiClient.materias.list() });
    const { data: flashcards = [] } = useQuery({ queryKey: ['flashcards'], queryFn: () => apiClient.flashcards.list() });
    const { data: sesiones = [] } = useQuery({ queryKey: ['sesiones'], queryFn: () => apiClient.sesiones.list() });

    const crearFlashcardMutation = useMutation({
        mutationFn: (data) => apiClient.flashcards.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries(['flashcards']);
            setShowModalFlashcard(false);
            setNuevaFlashcard({ pregunta: '', respuesta: '', materia_id: '' });
        }
    });

    const materiasConMazos = materias.filter(m => {
        const estaInscrito = inscripciones.some(i => String(i.materia_id) === String(m.id));
        return estaInscrito && m.nombre.toLowerCase().includes(busqueda.toLowerCase());
    });

    const abrirModalCarta = (materiaId) => {
        setNuevaFlashcard(prev => ({ ...prev, materia_id: materiaId }));
        setShowModalFlashcard(true);
    };

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-10 font-sans">
            <div className="max-w-6xl mx-auto">
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                    <div>
                        <Button asChild variant="ghost" className="mb-2 -ml-4 text-slate-500 hover:text-cyan-400 p-0">
                            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Dashboard</Link>
                        </Button>
                        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded-xl shadow-lg">
                                <Brain className="h-6 w-6 text-white" />
                            </div>
                            Focus Studio
                        </h1>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
                        <AmbienteSonoro />
                        <div className="h-8 w-px bg-slate-800 mx-1" />
                        <div className="flex gap-4 px-2">
                            <div className="text-center">
                                <p className="text-[9px] uppercase font-black text-slate-500">Sesiones</p>
                                <p className="text-sm font-black text-white">{sesiones.length}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[9px] uppercase font-black text-slate-500">Cartas</p>
                                <p className="text-sm font-black text-white">{flashcards.length}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <Tabs defaultValue="flashcards" className="space-y-6">
                    <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
                        <TabsTrigger value="pomodoro" className="px-6 rounded-lg data-[state=active]:bg-cyan-600 font-bold text-xs uppercase">Temporizador</TabsTrigger>
                        <TabsTrigger value="flashcards" className="px-6 rounded-lg data-[state=active]:bg-purple-600 font-bold text-xs uppercase">Flashcards</TabsTrigger>
                        <TabsTrigger value="feynman" className="px-6 rounded-lg data-[state=active]:bg-amber-600 font-bold text-xs uppercase">Feynman</TabsTrigger>
                    </TabsList>

                    <TabsContent value="pomodoro"><div className="max-w-md mx-auto"><Pomodoro /></div></TabsContent>

                    <TabsContent value="flashcards">
                        {!materiaSeleccionada ? (
                            <div className="space-y-6">
                                <div className="relative max-w-sm">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <Input
                                        placeholder="Buscar materia..."
                                        className="pl-10 bg-slate-900/50 border-slate-800 rounded-xl h-10 text-sm"
                                        value={busqueda}
                                        onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                </div>
                                {/* GRID COMPACTO DE MATERIAS */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {materiasConMazos.map((m) => {
                                        const insc = inscripciones.find(i => String(i.materia_id) === String(m.id));
                                        const count = flashcards.filter(f => String(f.materia_id) === String(m.id)).length;
                                        return (
                                            <motion.div key={m.id} whileHover={{ y: -3 }} onClick={() => setMateriaSeleccionada(m)} className="cursor-pointer">
                                                <Card className="bg-slate-900/60 border-slate-800 p-5 rounded-[1.5rem] relative overflow-hidden hover:border-purple-500/40 transition-all border-2">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400">
                                                            <Folder className="h-5 w-5" />
                                                        </div>
                                                        {insc?.estado === 'aprobada' && (
                                                            <Badge className="bg-green-500/20 text-green-400 border-none uppercase text-[8px] font-black tracking-widest px-2 py-0.5">
                                                                APROBADA
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <h3 className="text-base font-black text-white uppercase tracking-tight truncate">{m.nombre}</h3>
                                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">{count} TARJETAS</p>
                                                </Card>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <Button variant="ghost" onClick={() => setMateriaSeleccionada(null)} className="text-slate-500 hover:text-white p-0">
                                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                                    </Button>
                                    <Badge className="bg-purple-600/20 text-purple-400 border-purple-600/30 px-4 py-1.5 rounded-full text-[10px] font-black uppercase">
                                        {materiaSeleccionada.nombre}
                                    </Badge>
                                </div>
                                <FlashCards
                                    materiaSeleccionada={materiaSeleccionada.id}
                                    materiaNombre={materiaSeleccionada.nombre}
                                    flashcards={flashcards}
                                    onAddCard={() => abrirModalCarta(materiaSeleccionada.id)}
                                />
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="feynman">
                        <Card className="bg-slate-900/40 border-slate-800 p-12 text-center rounded-[2rem] border-dashed border-2">
                            <Lightbulb className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-white uppercase">Técnica de Feynman</h2>
                            <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">Explica un concepto como si se lo dijeras a un niño. Próximamente con IA.</p>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* MODAL CREAR FLASHCARD */}
            <Dialog open={showModalFlashcard} onOpenChange={setShowModalFlashcard}>
                <DialogContent className="bg-[#020617] border-slate-800 text-white max-w-2xl rounded-3xl p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-purple-600 rounded-xl">
                                <Brain className="h-5 w-5 text-white" />
                            </div>
                            Nueva Flashcard
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 mt-4">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pregunta *</Label>
                                    <Textarea
                                        placeholder="¿Qué es el polimorfismo en programación orientada a objetos?"
                                        className="bg-slate-900 border-slate-800 rounded-xl resize-none h-32 text-base"
                                        value={nuevaFlashcard.pregunta}
                                        onChange={e => setNuevaFlashcard({ ...nuevaFlashcard, pregunta: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Dificultad</Label>
                                    <div className="flex items-center gap-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNuevaFlashcard({ ...nuevaFlashcard, dificultad: star })}
                                                className={`p-2 rounded-lg transition-all ${(nuevaFlashcard.dificultad || 3) >= star
                                                        ? 'bg-yellow-500/20 text-yellow-400'
                                                        : 'bg-slate-800 text-slate-600 hover:bg-slate-700'
                                                    }`}
                                            >
                                                <Star className={`w-5 h-5 ${(nuevaFlashcard.dificultad || 3) >= star ? 'fill-yellow-400' : ''}`} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Respuesta *</Label>
                                    <Textarea
                                        placeholder="Es la capacidad de un objeto de tomar diferentes formas o comportamientos según el contexto..."
                                        className="bg-slate-900 border-slate-800 rounded-xl resize-none h-32 text-base"
                                        value={nuevaFlashcard.respuesta}
                                        onChange={e => setNuevaFlashcard({ ...nuevaFlashcard, respuesta: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Etiquetas (separadas por coma)</Label>
                                    <Input
                                        placeholder="POO, programación, conceptos"
                                        className="bg-slate-900 border-slate-800 rounded-xl"
                                        value={nuevaFlashcard.etiquetas || ''}
                                        onChange={e => setNuevaFlashcard({ ...nuevaFlashcard, etiquetas: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Explicación adicional (opcional)</Label>
                                <Textarea
                                    placeholder="Ejemplo práctico o información adicional..."
                                    className="bg-slate-900 border-slate-800 rounded-xl resize-none h-24"
                                    value={nuevaFlashcard.explicacion || ''}
                                    onChange={e => setNuevaFlashcard({ ...nuevaFlashcard, explicacion: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pista (opcional)</Label>
                                <Input
                                    placeholder="Una pista para recordar la respuesta..."
                                    className="bg-slate-900 border-slate-800 rounded-xl"
                                    value={nuevaFlashcard.pista || ''}
                                    onChange={e => setNuevaFlashcard({ ...nuevaFlashcard, pista: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 pt-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowModalFlashcard(false)}
                                className="flex-1 h-12 border-slate-700 text-slate-300 rounded-xl"
                            >
                                CANCELAR
                            </Button>
                            <Button
                                onClick={() => crearFlashcardMutation.mutate({
                                    ...nuevaFlashcard,
                                    dificultad: nuevaFlashcard.dificultad || 3,
                                    intervalo_dias: 1
                                })}
                                disabled={!nuevaFlashcard.pregunta || !nuevaFlashcard.respuesta}
                                className="flex-1 h-12 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 font-black uppercase rounded-xl"
                            >
                                <Sparkles className="w-4 h-4 mr-2" /> CREAR FLASHCARD
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}