import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    ArrowLeft, Filter, Sparkles, FileUp, BookOpen, 
    Search, Loader2, Award, X, Check, Globe, File, Paperclip
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import PostApunte from '../components/social/PostApunte';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function MuroApuntes() {
    const queryClient = useQueryClient();
    const fileInputRef = useRef(null);
    const [filtroMateria, setFiltroMateria] = useState("todas");
    const [busqueda, setBusqueda] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [file, setFile] = useState(null); // Estado para el archivo físico

    const [nuevoApunte, setNuevoApunte] = useState({
        materia_id: '',
        titulo: '',
        descripcion: '',
        contenido: '',
        formato: 'texto',
        compartido_publicamente: true,
        etiquetas: ''
    });

    // --- DATA FETCHING ---
    const { data: res, isLoading } = useQuery({
        queryKey: ['social-apuntes', filtroMateria],
        queryFn: () => apiClient.social.apuntes.list({ 
            materia_id: filtroMateria === "todas" ? undefined : filtroMateria 
        })
    });

    const { data: materias = [] } = useQuery({ 
        queryKey: ['materias'], 
        queryFn: () => apiClient.materias.list() 
    });

    // Mutación con soporte para FormData
    const compartirMutation = useMutation({
        mutationFn: (formData) => apiClient.social.apuntes.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(['social-apuntes']);
            setShowModal(false);
            setFile(null);
            resetForm();
        },
        onError: (err) => {
            const msg = err.response?.data?.detail || "Error al desplegar el recurso";
            alert(`SISTEMA: ${msg}`);
        }
    });

    const resetForm = () => {
        setNuevoApunte({ materia_id: '', titulo: '', descripcion: '', contenido: '', formato: 'texto', compartido_publicamente: true, etiquetas: '' });
    };

    const handleShare = () => {
        if (!nuevoApunte.materia_id || !nuevoApunte.titulo) {
            alert("Los campos Materia y Título son obligatorios para el despliegue.");
            return;
        }

        // Construcción de FormData para envío multipart/form-data
        const formData = new FormData();
        formData.append('materia_id', nuevoApunte.materia_id);
        formData.append('titulo', nuevoApunte.titulo);
        formData.append('descripcion', nuevoApunte.descripcion);
        formData.append('etiquetas', nuevoApunte.etiquetas);
        formData.append('compartido_publicamente', nuevoApunte.compartido_publicamente);
        
        if (file) {
            formData.append('archivo', file); // 'archivo' debe coincidir con el backend
            formData.append('formato', file.name.split('.').pop());
        } else {
            formData.append('contenido', nuevoApunte.contenido);
            formData.append('formato', 'texto/link');
        }

        compartirMutation.mutate(formData);
    };

    const apuntes = res?.apuntes || [];

    return (
        <div className="min-h-screen bg-[#020617] p-6 md:p-12 text-white overflow-x-hidden font-sans">
            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-6xl mx-auto relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="space-y-2">
                        <Button asChild variant="ghost" className="p-0 text-slate-500 hover:text-cyan-400 focus:text-cyan-400 transition-colors">
                            <Link to="/comunidad"><ArrowLeft className="mr-2 h-4 w-4" /> Hub Social</Link>
                        </Button>
                        <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">
                            Muro <span className="text-cyan-500">Global</span>
                        </h1>
                    </div>
                    <Button 
                        onClick={() => setShowModal(true)}
                        className="bg-white text-black hover:bg-slate-200 h-16 px-10 rounded-2xl font-black uppercase shadow-2xl transition-all hover:scale-105 active:scale-95"
                    >
                        <FileUp className="mr-2 w-6 h-6" /> Compartir Material
                    </Button>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    <aside className="space-y-6">
                        <div className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md">
                            <div className="flex items-center gap-2 mb-8">
                                <Filter className="w-4 h-4 text-cyan-500" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Filtrar por Cátedra</h3>
                            </div>
                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <button onClick={() => setFiltroMateria("todas")} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filtroMateria === "todas" ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                                    Todos los Apuntes
                                </button>
                                {materias.map(m => (
                                    <button key={m.id} onClick={() => setFiltroMateria(m.id)} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest truncate transition-all ${filtroMateria === m.id ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50' : 'text-slate-500 hover:bg-slate-800/50'}`}>
                                        {m.nombre}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    <main className="lg:col-span-3 space-y-8">
                        <div className="relative group">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
                            <Input 
                                placeholder="Buscar resúmenes, parciales o tips..." 
                                className="pl-14 h-16 bg-slate-900/50 border-slate-800 rounded-3xl text-lg focus:ring-2 focus:ring-cyan-500/20 transition-all shadow-2xl" 
                                value={busqueda} 
                                onChange={(e) => setBusqueda(e.target.value)} 
                            />
                        </div>

                        <AnimatePresence mode="popLayout">
                            {isLoading ? (
                                <div className="py-32 text-center space-y-4">
                                    <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mx-auto" />
                                    <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em] animate-pulse">Sincronizando biblioteca global...</p>
                                </div>
                            ) : apuntes.length > 0 ? (
                                apuntes.map((apunte, idx) => (
                                    <motion.div key={apunte.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}>
                                        <PostApunte apunte={apunte} onLike={(id) => console.log("Like", id)} />
                                    </motion.div>
                                ))
                            ) : (
                                <div className="py-40 text-center bg-slate-900/20 border-4 border-dashed border-slate-800 rounded-[4rem]">
                                    <BookOpen className="w-20 h-20 text-slate-800 mx-auto mb-6" />
                                    <p className="text-slate-600 font-black uppercase tracking-[0.4em] text-sm">Biblioteca Desierta</p>
                                    <p className="text-slate-700 text-xs mt-2 italic tracking-widest uppercase font-bold">Sé el primero en aportar a la red</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </main>
                </div>
            </div>

            {/* MODAL ÉPICO DE DESPLIEGUE */}
            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent className="bg-[#020617] border-slate-800 text-white max-w-2xl rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-purple-600 to-cyan-500" />
                    
                    <DialogHeader className="mb-8">
                        <DialogTitle className="text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                            <div className="p-3 bg-cyan-600/20 rounded-2xl"><FileUp className="w-8 h-8 text-cyan-400" /></div>
                            Desplegar <span className="text-slate-500">Recurso</span>
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Materia Destino</Label>
                                <Select onValueChange={(val) => setNuevoApunte({...nuevoApunte, materia_id: val})}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-xl">
                                        <SelectValue placeholder="Cátedra..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-950 border-slate-800 text-white">
                                        {materias.map(m => <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título</Label>
                                <Input className="bg-slate-900 border-slate-800 h-12 rounded-xl" placeholder="ej: Resumen_Final_2025" value={nuevoApunte.titulo} onChange={e => setNuevoApunte({...nuevoApunte, titulo: e.target.value})} />
                            </div>
                        </div>

                        {/* DROPZONE DE ARCHIVOS [NUEVO] */}
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Documento Académico</Label>
                            <div 
                                onClick={() => fileInputRef.current.click()}
                                className={`border-2 border-dashed rounded-[2.5rem] p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 ${file ? 'border-cyan-500/50 bg-cyan-500/5 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}`}
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    onChange={(e) => setFile(e.target.files[0])}
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                                />
                                {file ? (
                                    <div className="flex items-center gap-4 w-full animate-in zoom-in-95 duration-300">
                                        <div className="p-4 bg-cyan-600 rounded-3xl shadow-xl shadow-cyan-900/40"><File className="w-8 h-8 text-white" /></div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-black truncate text-cyan-400 uppercase tracking-tight">{file.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{(file.size / 1024 / 1024).toFixed(2)} MB • Listo para transmisión</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setFile(null); }} className="text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-full"><X className="w-6 h-6" /></Button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-5 bg-slate-800 rounded-[2rem] text-slate-500 group-hover:text-cyan-400 transition-colors shadow-inner"><FileUp className="w-10 h-10" /></div>
                                        <div className="text-center">
                                            <p className="text-sm font-black text-slate-300 uppercase tracking-tighter">Selecciona o arrastra el material</p>
                                            <p className="text-[9px] text-slate-600 font-bold mt-2 uppercase tracking-[0.2em]">PDF • DOC • XLS • PPT (MÁX 20MB)</p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {!file && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-500">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 text-center block">O pega un recurso externo</Label>
                                <Textarea className="bg-slate-900 border-slate-800 h-24 rounded-2xl p-4 resize-none font-mono text-xs text-cyan-500/80" placeholder="Link de Google Drive, GitHub o contenido en texto..." value={nuevoApunte.contenido} onChange={e => setNuevoApunte({...nuevoApunte, contenido: e.target.value})} />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-6 pt-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tags</Label>
                                <Input className="bg-slate-900 border-slate-800 h-12 rounded-xl" placeholder="ej: final, tp, 2024" value={nuevoApunte.etiquetas} onChange={e => setNuevoApunte({...nuevoApunte, etiquetas: e.target.value})} />
                            </div>
                            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-2xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Global</span>
                                    <span className="text-[8px] text-slate-500 font-bold">Visible para la red</span>
                                </div>
                                <Switch checked={nuevoApunte.compartido_publicamente} onCheckedChange={(val) => setNuevoApunte({...nuevoApunte, compartido_publicamente: val})} />
                            </div>
                        </div>

                        <Button 
                            onClick={handleShare}
                            disabled={compartirMutation.isLoading}
                            className="w-full h-16 bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-black text-lg uppercase rounded-[1.5rem] shadow-2xl shadow-cyan-900/20 transition-all hover:scale-[1.02] active:scale-95"
                        >
                            {compartirMutation.isLoading ? <Loader2 className="animate-spin w-6 h-6" /> : "DESPLEGAR EN EL MURO"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}