import React from 'react';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Calendar } from "lucide-react";

export default function CountdownCircle({ id, dias, nombre, tipo, color = "#00f2ff", onEdit, onDelete }) {
    const radio = 42;
    const circunferencia = 2 * Math.PI * radio;
    const progresoMaximo = 30; // 30 días para que el círculo se complete visualmente
    const porcentaje = Math.max(0, Math.min(dias / progresoMaximo, 1));
    const dashoffset = circunferencia * (1 - porcentaje);

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.02 }}
            className="relative flex flex-col items-center p-8 rounded-[3rem] bg-slate-900/40 border border-white/5 backdrop-blur-xl group transition-all hover:border-white/10 shadow-2xl"
        >
            {/* Acciones flotantes */}
            <div className="absolute top-6 right-6 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20">
                <button 
                    onClick={() => onEdit(id)}
                    className="p-2.5 bg-slate-800/90 hover:bg-cyan-600 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                    onClick={() => onDelete(id)}
                    className="p-2.5 bg-slate-800/90 hover:bg-rose-600 rounded-xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>

            <div className="relative w-32 h-32 mb-6 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    {/* Fondo del círculo */}
                    <circle cx="64" cy="64" r={radio} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />
                    {/* Círculo de progreso animado */}
                    <motion.circle
                        cx="64" cy="64" r={radio}
                        fill="transparent"
                        stroke={color}
                        strokeWidth="8"
                        strokeDasharray={circunferencia}
                        initial={{ strokeDashoffset: circunferencia }}
                        animate={{ strokeDashoffset: dashoffset }}
                        transition={{ duration: 2, ease: "easeOut" }}
                        strokeLinecap="round"
                        style={{ filter: `drop-shadow(0 0 12px ${color}44)` }}
                    />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-white tracking-tighter">{dias}</span>
                    <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest mt-[-4px]">Días</span>
                </div>
            </div>

            <div className="text-center w-full">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                    <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color }}>{tipo}</p>
                </div>
                <h4 className="text-sm font-black text-slate-100 uppercase tracking-tight line-clamp-1 group-hover:text-white transition-colors px-2">
                    {nombre}
                </h4>
            </div>
        </motion.div>
    );
}