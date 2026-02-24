import React from 'react';
import { motion } from "framer-motion";

export default function ChatBubble({ mensaje, esMio }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className={`flex ${esMio ? 'justify-end' : 'justify-start'} mb-4`}
        >
            <div className={`max-w-[70%] p-4 rounded-2xl shadow-lg ${
                esMio 
                ? 'bg-purple-600 text-white rounded-tr-none' 
                : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/5'
            }`}>
                <p className="text-sm leading-relaxed">{mensaje.contenido}</p>
                <span className={`text-[9px] block mt-1 opacity-50 font-bold ${esMio ? 'text-right' : 'text-left'}`}>
                    {new Date(mensaje.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
            </div>
        </motion.div>
    );
}