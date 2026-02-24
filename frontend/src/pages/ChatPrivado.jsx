import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Send, MoreVertical, ShieldCheck, Loader2 } from "lucide-react";
import ChatBubble from './../components/social/ChatBubble';

export default function ChatPrivado() {
    const { id: targetId } = useParams();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const scrollRef = useRef(null);

    // 1. Obtener info del usuario con el que hablamos
    const { data: perfilData } = useQuery({
        queryKey: ['usuario-perfil', targetId],
        queryFn: () => apiClient.social.usuarios.perfil(targetId)
    });

    // 2. Obtener historial de mensajes (asumimos endpoint de chat privado)
    const { data: mensajes = [], isLoading } = useQuery({
        queryKey: ['chat-privado', targetId],
        queryFn: () => apiClient.social.mensajes.list(targetId),
        refetchInterval: 3000 // Polling cada 3 segundos para simular tiempo real
    });

    // 3. Enviar mensaje
    const mutation = useMutation({
        mutationFn: (msg) => apiClient.social.mensajes.send(targetId, { contenido: msg }),
        onSuccess: () => {
            setNuevoMensaje("");
            queryClient.invalidateQueries(['chat-privado', targetId]);
        }
    });

    // Auto-scroll al final cuando hay mensajes nuevos
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [mensajes]);

    const handleSend = (e) => {
        e.preventDefault();
        if (nuevoMensaje.trim()) mutation.mutate(nuevoMensaje);
    };

    if (!perfilData) return null;

    return (
        <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
            {/* Header del Chat */}
            <header className="p-4 md:p-6 border-b border-white/5 bg-slate-900/40 backdrop-blur-xl flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate(`/comunidad/perfil/${targetId}`)}>
                        <Avatar className="h-10 w-10 border-2 border-purple-500/30">
                            <AvatarImage src={perfilData.usuario.avatar_url} />
                            <AvatarFallback className="bg-slate-800 text-xs font-black">{perfilData.usuario.nombre[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                            <h2 className="font-black text-white text-sm uppercase tracking-tight leading-none">
                                {perfilData.usuario.nombre} {perfilData.usuario.apellido}
                            </h2>
                            <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest mt-1 flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> En línea
                            </p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-[10px] font-black text-slate-500 uppercase">Seguridad</span>
                        <span className="text-[9px] text-cyan-500 font-bold uppercase flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Cifrado UTN
                        </span>
                    </div>
                    <Button variant="ghost" size="icon" className="text-slate-500"><MoreVertical className="w-5 h-5" /></Button>
                </div>
            </header>

            {/* Zona de Mensajes */}
            <main 
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar bg-[url('/grid.svg')] bg-center bg-fixed"
            >
                {isLoading ? (
                    <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-purple-500 animate-spin" /></div>
                ) : mensajes.length > 0 ? (
                    mensajes.map((msg, idx) => (
                        <ChatBubble 
                            key={idx} 
                            mensaje={msg} 
                            esMio={msg.usuario_id !== targetId} 
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-30">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                            <Send className="w-8 h-8 text-slate-600" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Comienza la conversación</p>
                    </div>
                )}
            </main>

            {/* Input de Mensaje */}
            <footer className="p-4 md:p-8 bg-slate-950 border-t border-white/5">
                <form onSubmit={handleSend} className="max-w-4xl mx-auto relative group">
                    <Input 
                        placeholder="Escribe un mensaje técnico..." 
                        className="bg-slate-900/50 border-slate-800 h-14 rounded-2xl pl-6 pr-16 text-sm focus:ring-purple-500/20 transition-all"
                        value={nuevoMensaje}
                        onChange={(e) => setNuevoMensaje(e.target.value)}
                    />
                    <Button 
                        type="submit"
                        disabled={!nuevoMensaje.trim() || mutation.isLoading}
                        className="absolute right-2 top-2 h-10 w-10 bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg transition-all active:scale-90"
                    >
                        {mutation.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                </form>
                <p className="text-center text-[8px] text-slate-700 font-bold uppercase tracking-[0.3em] mt-4">
                    Presiona Enter para enviar el mensaje
                </p>
            </footer>
        </div>
    );
}