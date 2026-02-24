import React from 'react';
import { useEstudio } from '@/context/EstudioContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Coffee, Zap, Play, Pause } from 'lucide-react';

export default function FloatingTimer() {
    const { timeLeft, isActive, mode, startTimer, pauseTimer } = useEstudio();

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const modeConfig = {
        WORK: { color: 'bg-cyan-500', icon: <Brain className="w-4 h-4 text-white" /> },
        SHORT: { color: 'bg-emerald-500', icon: <Coffee className="w-4 h-4 text-white" /> },
        LONG: { color: 'bg-blue-500', icon: <Zap className="w-4 h-4 text-white" /> }
    };

    return (
        <AnimatePresence>
            {isActive && (
                <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 100, opacity: 0 }}
                    className="fixed bottom-8 right-8 z-[100] flex items-center gap-3 bg-slate-950/80 backdrop-blur-xl border border-white/10 p-2 pl-4 rounded-2xl shadow-2xl"
                >
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-slate-500 leading-none mb-1">
                            {mode === 'WORK' ? 'Enfoque' : 'Descanso'}
                        </span>
                        <span className="text-xl font-mono font-black text-white leading-none">
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    <div className={`p-2.5 rounded-xl ${modeConfig[mode].color} shadow-lg shadow-cyan-500/20`}>
                        {modeConfig[mode].icon}
                    </div>

                    <button 
                        onClick={pauseTimer}
                        className="h-10 w-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                    >
                        <Pause className="w-4 h-4 text-white fill-current" />
                    </button>
                </motion.div>
            )}
        </AnimatePresence>
    );
}