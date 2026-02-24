import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, authHelper } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    Send, Users, FileText, ArrowLeft, MoreVertical, 
    ShieldCheck, Zap, Hash, Loader2, Sparkles, UserPlus, FileUp, X, Check
} from "lucide-react";
import ChatBubble from './../components/social/ChatBubble';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import ParticipantSearch from '../components/social/ParticipantSearch';

export default function ChatGrupo() {
    const { id } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const scrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const user = authHelper.getUser();

    // Estados de UI
    const [msg, setMsg] = useState("");
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    
    // Estado para carga de archivos
    const [selectedFile, setSelectedFile] = useState(null);
    const [fileTitle, setFileTitle] = useState("");

    // 1. Datos del Grupo y Recursos
    const { data: info, isLoading: loadingInfo } = useQuery({
        queryKey: ['grupo-detalle', id],
        queryFn: () => apiClient.social.grupos.get(id),
        enabled: !!id && id !== 'undefined'
    });

    // 2. Mensajes
    const { data: mensajes = [] } = useQuery({
        queryKey: ['grupo-mensajes', id],
        queryFn: () => apiClient.social.mensajes.list(id),
        enabled: !!id,
        refetchInterval: 3000 
    });

    // Mutación para enviar mensajes
    const sendMutation = useMutation({
        mutationFn: (text) => apiClient.social.mensajes.send(id, { contenido: text }),
        onSuccess: () => {
            setMsg("");
            queryClient.invalidateQueries(['grupo-mensajes', id]);
        }
    });

    // Mutación para subir archivos al repositorio
    const uploadMutation = useMutation({
        mutationFn: (formData) => apiClient.social.apuntes.create(formData),
        onSuccess: () => {
            queryClient.invalidateQueries(['grupo-detalle', id]);
            setShowUploadModal(false);
            setSelectedFile(null);
            setFileTitle("");
        },
        onError: (err) => alert(err.response?.data?.detail || "Error en la transmisión")
    });

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [mensajes]);

    const handleFileUpload = () => {
        if (!selectedFile || !fileTitle || !info?.grupo?.materia_id) return;

        const formData = new FormData();
        formData.append('materia_id', info.grupo.materia_id);
        formData.append('titulo', fileTitle);
        formData.append('archivo', selectedFile);
        formData.append('compartido_publicamente', 'true');

        uploadMutation.mutate(formData);
    };

    if (loadingInfo) return <div className="h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-cyan-500 w-12 h-12" /></div>;

    const { grupo = {}, recursos_destacados = [] } = info || {};

    return (
        <div className="h-screen bg-[#020617] flex overflow-hidden font-sans text-white">
            {/* Sidebar Izquierdo: Gestión */}
            <aside className="w-80 bg-slate-950/50 border-r border-white/5 backdrop-blur-xl hidden xl:flex flex-col p-8">
                <Button asChild variant="link" className="w-fit text-slate-500 p-0 hover:text-cyan-400 focus:text-cyan-400 transition-colors mb-10 no-underline">
                    <Link to="/comunidad"><ArrowLeft className="mr-2 h-4 w-4"/> Hub Social</Link>
                </Button>

                <div className="flex-1 space-y-10">
                    <div>
                        <Badge className="bg-purple-600/20 text-purple-400 border-none text-[8px] font-black uppercase mb-4 px-3 py-1">GRUPO ACTIVO</Badge>
                        <h2 className="text-3xl font-black uppercase tracking-tighter leading-none mb-4">{grupo.nombre}</h2>
                        <p className="text-slate-500 text-xs leading-relaxed border-l-2 border-slate-800 pl-4">{grupo.descripcion || "Sin descripción de misión."}</p>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            <Users className="w-3 h-3" /> Equipo ({grupo.integrantes_actuales})
                        </h3>
                        <Button 
                            onClick={() => setShowInviteModal(true)}
                            className="w-full bg-white/5 hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest text-cyan-400 h-12 rounded-xl"
                        >
                            <UserPlus className="w-3.5 h-3.5 mr-2" /> Invitar Colega
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Panel Central: Chat */}
            <main className="flex-1 flex flex-col relative bg-[url('/grid.svg')]">
                <header className="h-20 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between px-8 z-20">
                    <div className="flex items-center gap-5">
                        <div className="p-3 bg-purple-600 rounded-2xl shadow-2xl shadow-purple-900/40"><Hash className="w-5 h-5 text-white" /></div>
                        <div>
                            <h3 className="font-black text-sm uppercase tracking-widest">{grupo.nombre}</h3>
                            <p className="text-[10px] text-cyan-400 font-black uppercase tracking-widest">{grupo.materia_nombre}</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-500 hover:text-white"><MoreVertical className="w-5 h-5" /></Button>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
                    {mensajes.map((m, idx) => (
                        <ChatBubble key={idx} mensaje={m} esMio={m.usuario_id === user?.id} />
                    ))}
                </div>

                <footer className="p-8">
                    <form onSubmit={(e) => { e.preventDefault(); if(msg.trim()) sendMutation.mutate(msg); }} className="max-w-4xl mx-auto relative group">
                        <Input 
                            value={msg}
                            onChange={(e) => setMsg(e.target.value)}
                            placeholder="Escribe una consulta técnica..." 
                            className="bg-slate-900/90 border-slate-800 h-16 rounded-2xl pl-8 pr-20 text-sm focus:border-purple-500/50 transition-all shadow-2xl"
                        />
                        <Button type="submit" disabled={!msg.trim() || sendMutation.isLoading} className="absolute right-3 top-3 h-10 w-10 bg-purple-600 hover:bg-purple-500 rounded-xl shadow-xl transition-all">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </footer>
            </main>

            {/* Sidebar Derecho: Repositorio */}
            <aside className="w-80 bg-slate-950/50 border-l border-white/5 backdrop-blur-xl hidden lg:flex flex-col p-8">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> Repositorio</h3>
                    <Badge variant="outline" className="text-[8px] border-slate-800 text-slate-600 font-black px-2">{recursos_destacados.length} ITEMS</Badge>
                </div>

                <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pr-2">
                    {recursos_destacados.map(rec => (
                        <Card key={rec.id} className="bg-slate-900/40 border-white/5 p-4 rounded-2xl hover:border-cyan-500/30 transition-all cursor-pointer group">
                            <div className="flex items-start gap-4">
                                <div className="p-2.5 bg-cyan-500/10 rounded-xl text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all"><FileText className="w-4 h-4" /></div>
                                <div className="min-w-0">
                                    <h4 className="text-[11px] font-black text-white uppercase truncate">{rec.titulo}</h4>
                                    <p className="text-[8px] text-slate-500 mt-1 uppercase font-bold">{rec.formato} • {rec.veces_descargado || 0} DESC</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <Button 
                    onClick={() => setShowUploadModal(true)}
                    className="mt-8 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-black uppercase text-[10px] h-14 rounded-2xl shadow-xl shadow-cyan-900/20"
                >
                    <FileUp className="w-4 h-4 mr-2" /> Subir al Repositorio
                </Button>
            </aside>

            {/* MODAL DE CARGA DE ARCHIVOS [NUEVO] */}
            <Dialog open={showUploadModal} onOpenChange={setShowUploadModal}>
                <DialogContent className="bg-[#020617] border-slate-800 text-white max-w-md rounded-[2.5rem] p-8 shadow-2xl">
                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Desplegar Recurso</DialogTitle></DialogHeader>
                    <div className="space-y-6 mt-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Título del archivo</Label>
                            <Input placeholder="ej: Apunte Clase 04" className="bg-slate-900 border-slate-800 h-12 rounded-xl" value={fileTitle} onChange={e => setFileTitle(e.target.value)} />
                        </div>
                        
                        <div 
                            onClick={() => fileInputRef.current.click()}
                            className={`border-2 border-dashed rounded-3xl p-10 transition-all cursor-pointer flex flex-col items-center justify-center gap-3 ${selectedFile ? 'border-cyan-500/50 bg-cyan-500/5' : 'border-slate-800 hover:border-slate-700 bg-slate-900/30'}`}
                        >
                            <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                            {selectedFile ? (
                                <div className="text-center animate-in zoom-in-95">
                                    <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                                    <p className="text-xs font-bold truncate max-w-[200px]">{selectedFile.name}</p>
                                </div>
                            ) : (
                                <>
                                    <FileUp className="w-10 h-10 text-slate-700" />
                                    <p className="text-[10px] font-black text-slate-500 uppercase">Seleccionar Documento</p>
                                </>
                            )}
                        </div>

                        <Button 
                            onClick={handleFileUpload}
                            disabled={uploadMutation.isLoading || !selectedFile}
                            className="w-full h-14 bg-gradient-to-r from-cyan-600 to-blue-700 font-black uppercase rounded-2xl"
                        >
                            {uploadMutation.isLoading ? <Loader2 className="animate-spin" /> : "SUBIR AHORA"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Invitación (Igual que antes) */}
            <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
                <DialogContent className="bg-[#020617] border-slate-800 text-white max-w-lg rounded-3xl p-8">
                    <DialogHeader><DialogTitle className="text-2xl font-black uppercase tracking-tighter">Reclutar Miembros</DialogTitle></DialogHeader>
                    <div className="space-y-6 mt-4">
                        <ParticipantSearch />
                        <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800 text-center">
                            <p className="text-[10px] text-slate-500 font-black uppercase mb-3">Enlace de acceso rápido</p>
                            <code className="text-[10px] text-cyan-400 bg-black/50 p-2 rounded block mb-4">UTN-GRP-{grupo.codigo_invitacion}</code>
                            <Button className="w-full bg-purple-600 font-black uppercase text-[10px] rounded-xl h-10">Copiar Invitación</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}