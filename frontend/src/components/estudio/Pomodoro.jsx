import React, { useState } from 'react';
import { useEstudio } from '@/context/EstudioContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
    Settings2, Play, Pause, 
    Coffee, Brain, Volume2, VolumeX, 
    Zap, RefreshCcw, RotateCcw,
    CheckCircle2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Pomodoro({ materiaId }) {
    const { 
        timeLeft, isActive, mode, completedSessions, sessionInCycle, 
        config, setConfig, startTimer, pauseTimer, 
        resetTimer, resetCycles 
    } = useEstudio();
    
    const [isEditing, setIsEditing] = useState(false);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // FUNCIÓN MEJORADA: Gatilla el reinicio completo de modo y tiempo
    const handleFullReset = () => {
        resetTimer(); // Ahora el contexto se encarga de poner mode en 'WORK'
    };

    const handleApplyConfig = () => {
        handleFullReset();
        setIsEditing(false);
    };

    const modeStyles = {
        WORK: "border-cyan-500/30 bg-cyan-950/20 text-cyan-400 shadow-cyan-500/10",
        SHORT: "border-emerald-500/30 bg-emerald-950/20 text-emerald-400 shadow-emerald-500/10",
        LONG: "border-blue-500/30 bg-blue-950/20 text-blue-400 shadow-blue-500/10"
    };

    const modeLabels = {
        WORK: { label: "Enfoque", icon: <Brain className="w-4 h-4"/> },
        SHORT: { label: "Descanso Corto", icon: <Coffee className="w-4 h-4"/> },
        LONG: { label: "Descanso Largo", icon: <Zap className="w-4 h-4"/> }
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <motion.div 
                layout
                className={`p-8 rounded-[2.5rem] border-2 transition-all duration-700 shadow-2xl ${modeStyles[mode]}`}
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/20 backdrop-blur-md border border-white/5">
                        {modeLabels[mode].icon}
                        <span className="text-xs font-black uppercase tracking-widest">
                            {modeLabels[mode].label}
                        </span>
                    </div>
                    
                    <div className="flex gap-1">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setConfig({...config, soundEnabled: !config.soundEnabled})}
                            className="text-slate-400 hover:text-white"
                        >
                            {config.soundEnabled ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
                        </Button>
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => setIsEditing(!isEditing)}
                            className={`transition-all duration-500 ${isEditing ? 'rotate-180 text-cyan-400' : 'text-slate-400'}`}
                        >
                            <Settings2 className="w-5 h-5" />
                        </Button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {isEditing ? (
                        <motion.div 
                            key="settings"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="space-y-6 py-4"
                        >
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Enfoque", key: "workTime" },
                                    { label: "D. Corto", key: "shortBreak" },
                                    { label: "D. Largo", key: "longBreak" },
                                    { label: "Ciclos", key: "sessionsUntilLongBreak" }
                                ].map((field) => (
                                    <div key={field.key} className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-500 tracking-wider pl-1">{field.label}</Label>
                                        <Input 
                                            type="number" 
                                            className="bg-slate-900/50 border-slate-800 text-white rounded-xl" 
                                            value={config[field.key]} 
                                            onChange={(e) => {
                                                const val = parseInt(e.target.value);
                                                setConfig({...config, [field.key]: isNaN(val) ? 1 : val});
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                            <Button className="w-full bg-white text-black hover:bg-slate-200 font-black rounded-2xl h-14" onClick={handleApplyConfig}>
                                GUARDAR CAMBIOS
                            </Button>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="timer"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                            className="text-center mb-10"
                        >
                            <div className="relative inline-block">
                                <motion.h2 
                                    className="text-[7.5rem] font-black font-mono tracking-tighter leading-none text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)]"
                                    animate={{ scale: isActive ? [1, 1.03, 1] : 1 }}
                                    transition={{ repeat: Infinity, duration: 2.5 }}
                                >
                                    {formatTime(timeLeft)}
                                </motion.h2>
                                
                                {/* INDICADOR DE PROGRESO: Usa sessionInCycle para no borrar el total del día */}
                                <div className="flex justify-center gap-2 mt-6">
                                    {[...Array(config.sessionsUntilLongBreak)].map((_, i) => (
                                        <div 
                                            key={i} 
                                            className={`h-2 rounded-full transition-all duration-700 ${
                                                i < sessionInCycle 
                                                ? 'w-8 bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]' 
                                                : 'w-2 bg-slate-800'
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="flex gap-4">
                    {!isActive ? (
                        <Button 
                            onClick={startTimer} 
                            className="flex-[2] h-16 bg-white text-black hover:bg-slate-200 text-xl font-black rounded-[1.5rem] shadow-xl transition-all active:scale-95 group"
                        >
                            <Play className="w-6 h-6 mr-2 fill-current group-hover:scale-110 transition-transform" /> EMPEZAR
                        </Button>
                    ) : (
                        <Button 
                            onClick={pauseTimer} 
                            className="flex-[2] h-16 bg-black/40 text-white hover:bg-black/60 border border-white/10 text-xl font-black rounded-[1.5rem] transition-all active:scale-95"
                        >
                            <Pause className="w-6 h-6 mr-2 fill-current" /> PAUSAR
                        </Button>
                    )}
                    <Button 
                        variant="outline" 
                        className="h-16 w-16 border-white/10 bg-white/5 hover:bg-white/10 rounded-[1.5rem] transition-all group" 
                        onClick={handleFullReset}
                    >
                        <RotateCcw className="w-6 h-6 text-white group-hover:rotate-[-90deg] transition-transform duration-500" />
                    </Button>
                </div>

                <div className="flex flex-col items-center mt-8 gap-3">
                    <div className="flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/5">
                        <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
                            {completedSessions} Sesiones logradas hoy
                        </span>
                    </div>
                    
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                            if(window.confirm("¿Reiniciar el ciclo actual? No se perderán las sesiones del día.")) {
                                resetCycles(); 
                                handleFullReset(); 
                            }
                        }}
                        className="text-[9px] h-6 text-slate-600 hover:text-rose-400 uppercase font-black tracking-widest"
                    >
                        Reiniciar Ciclo Actual
                    </Button>
                </div>
            </motion.div>
        </div>
    );
}