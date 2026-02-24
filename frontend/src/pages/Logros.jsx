import React from 'react';
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import LogrosInsignias from '../components/logros/LogrosInsignias'; 

export default function Logros() {
    // 1. Cargamos las categorías reales de la DB
    const { data: categorias = [], isLoading: loadingCats } = useQuery({
        queryKey: ['categorias-logros'],
        queryFn: apiClient.logros.categorias
    });

    // 2. Cargamos todos los logros con su estado de desbloqueo
    const { data: logros = [], isLoading: loadingLogros } = useQuery({
        queryKey: ['logros-usuario'],
        queryFn: () => apiClient.logros.list()
    });

    if (loadingCats || loadingLogros) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
                    <Button asChild variant="ghost" className="mb-4 text-slate-400 hover:text-white">
                        <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Volver al Dashboard</Link>
                    </Button>
                    <h1 className="text-5xl font-black text-white mb-2 flex items-center gap-3 tracking-tighter">
                        <Trophy className="w-10 h-10 text-amber-400" /> LOGROS E INSIGNIAS
                    </h1>
                    <p className="text-slate-400 text-lg">Tu progreso académico convertido en leyenda.</p>
                </motion.div>

                {/* Pasamos los datos puros al componente visual */}
                <LogrosInsignias 
                    logros={logros} 
                    categorias={categorias}
                />
            </div>
        </div>
    );
}