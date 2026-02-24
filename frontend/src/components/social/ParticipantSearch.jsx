import React, { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Input } from "@/components/ui/input";
import { Search, User, X, Loader2, MessageSquare, Users, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

export default function ParticipantSearch() {
    const [query, setQuery] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const containerRef = useRef(null);
    const navigate = useNavigate();

    // Consulta optimizada al backend de Python
    const { data: resultados = [], isLoading } = useQuery({
        queryKey: ['social-usuarios-buscar', debouncedQuery],
        queryFn: () => apiClient.social.usuarios.buscar({ query: debouncedQuery }),
        enabled: debouncedQuery.length >= 2,
    });

    // Lógica de Debounce para no saturar la base de datos
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 300);
        return () => clearTimeout(timer);
    }, [query]);

    // Cerrar el dropdown al hacer clic fuera del componente
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelectUser = (id) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/comunidad/perfil/${id}`);
    };

    const handleStartChat = (e, id) => {
        e.stopPropagation(); // Evita que se dispare el clic del contenedor padre (perfil)
        setIsOpen(false);
        setQuery('');
        navigate(`/comunidad/chat/privado/${id}`);
    };

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-cyan-400 transition-colors" />
                <Input
                    type="search"
                    placeholder="Buscar por nombre, legajo o mail..."
                    className="pl-12 pr-10 h-14 bg-slate-900/50 border-slate-800 rounded-2xl text-base placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-offset-0 transition-all shadow-lg"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(e.target.value.length >= 2);
                    }}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                />
                {query && (
                    <button
                        onClick={() => { setQuery(''); setIsOpen(false); }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.98 }}
                        className="absolute top-full mt-3 w-full bg-[#0f172a]/95 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden"
                    >
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/5">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                {isLoading ? 'Escaneando base de datos...' : `Resultados Encontrados: ${resultados.length}`}
                            </span>
                            {!isLoading && <Badge className="bg-cyan-500/10 text-cyan-400 border-none text-[8px] font-black uppercase">Filtro Inteligente</Badge>}
                        </div>

                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {isLoading ? (
                                <div className="p-12 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Buscando Colegas...</p>
                                </div>
                            ) : resultados.length > 0 ? (
                                resultados.map((usuario, index) => (
                                    <motion.div
                                        key={usuario.id}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.03 }}
                                        className="p-4 hover:bg-white/5 border-b border-white/5 last:border-b-0 cursor-pointer group flex items-center justify-between transition-all"
                                        onClick={() => handleSelectUser(usuario.id)}
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="relative">
                                                <Avatar className="h-12 w-12 border-2 border-slate-700 group-hover:border-cyan-500/50 transition-colors shadow-xl">
                                                    <AvatarImage src={usuario.avatar_url} />
                                                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-cyan-600 text-white font-black uppercase">
                                                        {usuario.nombre[0]}{usuario.apellido[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {usuario.promedio >= 8 && (
                                                    <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-1 shadow-lg border-2 border-slate-900">
                                                        <Star className="w-2 h-2 text-white fill-current" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <h4 className="font-bold text-white text-sm truncate uppercase tracking-tight group-hover:text-cyan-400 transition-colors">
                                                    {usuario.nombre} {usuario.apellido}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-slate-500 font-mono">{usuario.legajo}</span>
                                                    {usuario.total_materias_comunes > 0 && (
                                                        <span className="text-[9px] text-purple-400 font-black uppercase">
                                                            • {usuario.total_materias_comunes} en común
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <button 
                                            onClick={(e) => handleStartChat(e, usuario.id)}
                                            className="p-3 bg-slate-800/50 rounded-2xl text-slate-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                                        >
                                            <MessageSquare className="w-4 h-4" />
                                        </button>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="p-12 text-center">
                                    <User className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No se detectaron usuarios</p>
                                    <p className="text-slate-700 text-[10px] mt-1 italic">Prueba con nombre, apellido o legajo exacto</p>
                                </div>
                            )}
                        </div>

                        {resultados.length > 0 && (
                            <div className="p-3 bg-white/[0.02] border-t border-white/5 text-center">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">
                                    Arquitectura de Red Social UTN-FRC
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}