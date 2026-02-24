import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
    X, Plus, Play, Layers, RotateCw, 
    ArrowLeft, ChevronRight, Star, TrendingUp,
    CheckCircle, XCircle, Brain, Timer,
    BarChart3, RefreshCw, Volume2, Settings
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function FlashCards({ 
    flashcards = [], 
    materiaSeleccionada, 
    materiaNombre, 
    onAddCard,
    onBack 
}) {
    const [modoEstudio, setModoEstudio] = useState(false);
    const [indiceActual, setIndiceActual] = useState(0);
    const [mostrarRespuesta, setMostrarRespuesta] = useState(false);
    const [historialRespuestas, setHistorialRespuestas] = useState([]);
    const [estadisticas, setEstadisticas] = useState({
        total: 0,
        correctas: 0,
        incorrectas: 0,
        tiempoPromedio: 0,
        rachaActual: 0,
        mejorRacha: 0
    });
    const [configuracion, setConfiguracion] = useState({
        mostrarPista: false,
        tiempoLimite: false,
        ordenAleatorio: false,
        audioHabilitado: true,
        dificultadAdaptativa: true
    });
    const [tiempoInicio, setTiempoInicio] = useState(null);
    const [tiempoTranscurrido, setTiempoTranscurrido] = useState(0);
    const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
    const [modoDificultad, setModoDificultad] = useState('todas');

    const cardsMateria = useMemo(() => {
        let filtered = flashcards.filter(f => String(f.materia_id) === String(materiaSeleccionada));
        
        if (modoDificultad === 'facil') {
            filtered = filtered.filter(f => f.dificultad <= 2);
        } else if (modoDificultad === 'media') {
            filtered = filtered.filter(f => f.dificultad === 3);
        } else if (modoDificultad === 'dificil') {
            filtered = filtered.filter(f => f.dificultad >= 4);
        }
        
        if (configuracion.ordenAleatorio) {
            return [...filtered].sort(() => Math.random() - 0.5);
        } else {
            return filtered.sort((a, b) => {
                const aNecesita = new Date(a.proxima_revision) <= new Date();
                const bNecesita = new Date(b.proxima_revision) <= new Date();
                if (aNecesita && !bNecesita) return -1;
                if (!aNecesita && bNecesita) return 1;
                return a.dificultad - b.dificultad;
            });
        }
    }, [flashcards, materiaSeleccionada, configuracion.ordenAleatorio, modoDificultad]);

    const flashcardActual = cardsMateria[indiceActual];

    useEffect(() => {
        let interval;
        if (modoEstudio && tiempoInicio && configuracion.tiempoLimite) {
            interval = setInterval(() => {
                setTiempoTranscurrido(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [modoEstudio, tiempoInicio, configuracion.tiempoLimite]);

    useEffect(() => {
        if (modoEstudio && flashcardActual) {
            setTiempoInicio(Date.now());
            setTiempoTranscurrido(0);
        }
    }, [modoEstudio, indiceActual]);

    const playSound = useCallback((type) => {
        if (!configuracion.audioHabilitado) return;
        
        const sounds = {
            flip: 'https://assets.mixkit.co/sfx/preview/mixkit-unlock-game-notification-253.mp3',
            correct: 'https://assets.mixkit.co/sfx/preview/mixkit-winning-chimes-2015.mp3',
            wrong: 'https://assets.mixkit.co/sfx/preview/mixkit-wrong-answer-fail-notification-946.mp3',
            complete: 'https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'
        };
        
        const audio = new Audio(sounds[type]);
        audio.volume = 0.3;
        audio.play().catch(() => {});
    }, [configuracion.audioHabilitado]);

    const handleSiguiente = useCallback((correcta = true) => {
        if (!flashcardActual) return;
        
        playSound(correcta ? 'correct' : 'wrong');
        
        const tiempoRespuesta = ((Date.now() - tiempoInicio) / 1000).toFixed(1);
        
        setHistorialRespuestas(prev => [...prev, {
            flashcardId: flashcardActual.id,
            correcta,
            tiempo: tiempoRespuesta,
            fecha: new Date()
        }]);
        
        setEstadisticas(prev => {
            const nuevaRacha = correcta ? prev.rachaActual + 1 : 0;
            return {
                total: prev.total + 1,
                correctas: prev.correctas + (correcta ? 1 : 0),
                incorrectas: prev.incorrectas + (correcta ? 0 : 1),
                tiempoPromedio: ((prev.tiempoPromedio * prev.total) + parseFloat(tiempoRespuesta)) / (prev.total + 1),
                rachaActual: nuevaRacha,
                mejorRacha: Math.max(prev.mejorRacha, nuevaRacha)
            };
        });
        
        setMostrarRespuesta(false);
        
        if (indiceActual < cardsMateria.length - 1) {
            setTimeout(() => {
                setIndiceActual(prev => prev + 1);
                setTiempoInicio(Date.now());
                setTiempoTranscurrido(0);
            }, 300);
        } else {
            setTimeout(() => {
                playSound('complete');
                setMostrarEstadisticas(true);
            }, 500);
        }
    }, [flashcardActual, tiempoInicio, indiceActual, cardsMateria.length, playSound]);

    const handleVoltear = useCallback(() => {
        playSound('flip');
        setMostrarRespuesta(prev => !prev);
    }, [playSound]);

    const handleAnterior = useCallback(() => {
        if (indiceActual > 0) {
            setMostrarRespuesta(false);
            setTimeout(() => {
                setIndiceActual(prev => prev - 1);
                setTiempoInicio(Date.now());
                setTiempoTranscurrido(0);
            }, 100);
        }
    }, [indiceActual]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!modoEstudio) return;
            
            switch(e.key) {
                case ' ':
                case 'Spacebar':
                    e.preventDefault();
                    handleVoltear();
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    handleSiguiente(true);
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handleAnterior();
                    break;
                case '1':
                case '2':
                    e.preventDefault();
                    handleSiguiente(e.key === '1');
                    break;
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modoEstudio, handleVoltear, handleSiguiente, handleAnterior]);

    const renderDificultad = (nivel) => {
        return (
            <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star 
                        key={star}
                        className={`w-3 h-3 ${star <= nivel ? 'text-yellow-500 fill-yellow-500' : 'text-slate-700'}`}
                    />
                ))}
            </div>
        );
    };

    const progreso = ((indiceActual + 1) / cardsMateria.length) * 100;

    if (mostrarEstadisticas) {
        const porcentajeExito = estadisticas.total > 0 
            ? Math.round((estadisticas.correctas / estadisticas.total) * 100) 
            : 0;
            
        return (
            <div className="fixed inset-0 z-50 bg-[#020617] flex items-center justify-center p-4 backdrop-blur-xl">
                <div className="w-full max-w-2xl space-y-8">
                    <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Brain className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tight">¡Sesión Completada!</h2>
                        <p className="text-slate-400 mt-2">Revisa tu desempeño</p>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-center">
                            <div className="text-4xl font-black text-white">{porcentajeExito}%</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Éxito</div>
                        </Card>
                        <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-center">
                            <div className="text-4xl font-black text-white">{estadisticas.total}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Total</div>
                        </Card>
                        <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-center">
                            <div className="text-4xl font-black text-white">{estadisticas.mejorRacha}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Mejor Racha</div>
                        </Card>
                        <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-center">
                            <div className="text-4xl font-black text-white">{estadisticas.rachaActual}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Racha Actual</div>
                        </Card>
                        <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-center">
                            <div className="text-4xl font-black text-white">{estadisticas.tiempoPromedio.toFixed(1)}s</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">Tiempo/Pregunta</div>
                        </Card>
                        <Card className="bg-slate-900/60 border-slate-800 p-6 rounded-2xl text-center">
                            <div className="text-4xl font-black text-white">{cardsMateria.length}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-widest mt-2">En Mazo</div>
                        </Card>
                    </div>
                    
                    <div className="flex gap-4">
                        <Button 
                            onClick={() => {
                                setMostrarEstadisticas(false);
                                setModoEstudio(false);
                                setIndiceActual(0);
                                setHistorialRespuestas([]);
                                setEstadisticas({
                                    total: 0,
                                    correctas: 0,
                                    incorrectas: 0,
                                    tiempoPromedio: 0,
                                    rachaActual: 0,
                                    mejorRacha: 0
                                });
                            }}
                            className="flex-1 h-14 bg-purple-600 hover:bg-purple-500 rounded-2xl font-black uppercase"
                        >
                            FINALIZAR
                        </Button>
                        <Button 
                            onClick={() => {
                                setMostrarEstadisticas(false);
                                setIndiceActual(0);
                                setHistorialRespuestas([]);
                                setEstadisticas({
                                    total: 0,
                                    correctas: 0,
                                    incorrectas: 0,
                                    tiempoPromedio: 0,
                                    rachaActual: 0,
                                    mejorRacha: 0
                                });
                                setTiempoInicio(Date.now());
                                setTiempoTranscurrido(0);
                            }}
                            className="flex-1 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-2xl font-black uppercase"
                        >
                            <RefreshCw className="w-4 h-4 mr-2" /> REPETIR
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (modoEstudio && flashcardActual) {
        return (
            <div className="fixed inset-0 z-50 bg-gradient-to-br from-[#020617] to-slate-950 flex items-center justify-center p-4">
                <div className="w-full max-w-4xl space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                    setModoEstudio(false);
                                    setIndiceActual(0);
                                    setMostrarRespuesta(false);
                                }}
                                className="text-slate-400 hover:text-white rounded-full"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                            <div>
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">{materiaNombre}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-slate-500 font-black">
                                        {indiceActual + 1} / {cardsMateria.length}
                                    </span>
                                    <div className="h-1 w-24 bg-slate-800 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${progreso}%` }}
                                            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs">
                                <Timer className="w-4 h-4 text-slate-500" />
                                <span className="text-slate-300 font-bold">{tiempoTranscurrido}s</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge className="bg-slate-800/50 text-slate-300 border-slate-700">
                                    Racha: {estadisticas.rachaActual}
                                </Badge>
                                <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                                    {renderDificultad(flashcardActual.dificultad || 3)}
                                </Badge>
                            </div>
                        </div>
                    </div>
                    
                    {/* TARJETA 3D CORREGIDA - SOLUCIÓN AL PROBLEMA DE VISIBILIDAD */}
                    <div 
                        className="relative w-full h-[400px]"
                        style={{ 
                            perspective: '1000px',
                            transformStyle: 'preserve-3d'
                        }}
                    >
                        <motion.div 
                            className="w-full h-full relative cursor-pointer"
                            style={{ 
                                transformStyle: 'preserve-3d',
                                position: 'relative'
                            }}
                            animate={{ rotateY: mostrarRespuesta ? 180 : 0 }}
                            transition={{ 
                                type: "spring", 
                                stiffness: 300, 
                                damping: 25,
                                duration: 0.6
                            }}
                            onClick={handleVoltear}
                        >
                            {/* FRENTE - PREGUNTA (visible cuando rotateY = 0) */}
                            <div 
                                className="absolute inset-0 w-full h-full"
                                style={{ 
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(0deg)'
                                }}
                            >
                                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-2xl w-full h-full">
                                    <div className="absolute top-6 left-6">
                                        <Badge variant="outline" className="bg-slate-900/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                                            PREGUNTA
                                        </Badge>
                                    </div>
                                    
                                    <div className="max-w-2xl">
                                        <h3 className="text-3xl font-black text-white leading-tight mb-6">
                                            {flashcardActual.pregunta}
                                        </h3>
                                        
                                        {configuracion.mostrarPista && flashcardActual.pista && (
                                            <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                                                <p className="text-sm text-slate-400 italic">Pista: {flashcardActual.pista}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="absolute bottom-6 flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                        <RotateCw className="w-3 h-3" /> CLICK o ESPACIO para revelar
                                    </div>
                                </div>
                            </div>
                            
                            {/* REVERSO - RESPUESTA (visible cuando rotateY = 180) */}
                            <div 
                                className="absolute inset-0 w-full h-full"
                                style={{ 
                                    backfaceVisibility: 'hidden',
                                    WebkitBackfaceVisibility: 'hidden',
                                    transform: 'rotateY(180deg)'
                                }}
                            >
                                <div className="bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border-2 border-purple-500/30 rounded-3xl flex flex-col items-center justify-center p-8 text-center shadow-[0_0_60px_rgba(168,85,247,0.2)] w-full h-full">
                                    <div className="absolute top-6 left-6">
                                        <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-widest">
                                            RESPUESTA
                                        </Badge>
                                    </div>
                                    
                                    <div className="max-w-2xl">
                                        <div className="text-2xl font-bold text-white leading-relaxed mb-8">
                                            {flashcardActual.respuesta}
                                        </div>
                                        
                                        {flashcardActual.explicacion && (
                                            <div className="mt-6 p-4 bg-slate-800/30 rounded-xl border border-slate-700">
                                                <p className="text-sm text-slate-300">{flashcardActual.explicacion}</p>
                                            </div>
                                        )}
                                        
                                        <div className="flex items-center justify-center gap-2 mt-6">
                                            <span className="text-xs text-slate-500">Etiquetas:</span>
                                            {flashcardActual.etiquetas?.split(',').map((tag, i) => (
                                                <Badge key={i} variant="secondary" className="text-[10px]">
                                                    {tag.trim()}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                    
                                    <div className="absolute bottom-6 text-purple-400/50 text-[10px] font-black uppercase tracking-widest">
                                        ¿Cómo te fue con esta pregunta?
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                        
                        <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                            <div className="flex items-center gap-2 text-slate-500 text-xs">
                                <div className={`w-2 h-2 rounded-full ${mostrarRespuesta ? 'bg-purple-500' : 'bg-slate-700'}`} />
                                <div className={`w-2 h-2 rounded-full ${!mostrarRespuesta ? 'bg-slate-300' : 'bg-slate-700'}`} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-5 gap-4">
                        <Button 
                            onClick={handleAnterior}
                            disabled={indiceActual === 0}
                            variant="outline"
                            className="h-14 border-slate-700 text-slate-300 hover:bg-slate-800 rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" /> Anterior
                        </Button>
                        
                        <Button 
                            onClick={() => handleSiguiente(false)}
                            className="h-14 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 rounded-xl font-black text-xs uppercase col-span-2"
                        >
                            <XCircle className="w-4 h-4 mr-2" /> NO RECUERDO
                        </Button>
                        
                        <Button 
                            onClick={() => handleSiguiente(true)}
                            className="h-14 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 rounded-xl font-black text-xs uppercase col-span-2"
                        >
                            <CheckCircle className="w-4 h-4 mr-2" /> ¡LO SABÍA!
                        </Button>
                    </div>
                    
                    <div className="flex justify-center gap-6 text-xs text-slate-500">
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">ESPACIO</kbd>
                            <span>Voltear</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">←</kbd>
                            <span>Anterior</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">1</kbd>
                            <span>Incorrecto</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <kbd className="px-2 py-1 bg-slate-800 rounded text-xs">2</kbd>
                            <span>Correcto</span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Vista principal del mazo
    return (
        <div className="space-y-8">
            <Card className="bg-gradient-to-br from-slate-900/60 to-slate-950/60 border-slate-800 p-8 rounded-3xl border-2 shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-start gap-6">
                        <div className="relative">
                            <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl shadow-purple-900/30">
                                <Layers className="text-white w-10 h-10" />
                            </div>
                            <Badge className="absolute -top-2 -right-2 bg-gradient-to-r from-purple-500 to-cyan-500 text-white border-none px-3 py-1 text-xs font-black">
                                {cardsMateria.length}
                            </Badge>
                        </div>
                        
                        <div>
                            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                {materiaNombre}
                            </h2>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-400">
                                        {cardsMateria.filter(f => f.dificultad >= 4).length} difíciles
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Timer className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-400">
                                        {cardsMateria.filter(f => new Date(f.proxima_revision) <= new Date()).length} por repasar
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-3">
                        <Button 
                            onClick={() => setModoEstudio(true)}
                            disabled={cardsMateria.length === 0}
                            className="h-12 px-8 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 rounded-xl font-black uppercase text-sm tracking-tight shadow-lg shadow-purple-900/30"
                        >
                            <Play className="w-4 h-4 mr-2 fill-current" /> ESTUDIAR MAZO
                        </Button>
                        
                        <Button 
                            variant="outline"
                            onClick={onAddCard}
                            className="h-12 px-6 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl font-bold"
                        >
                            <Plus className="w-4 h-4 mr-2" /> NUEVA CARTA
                        </Button>
                    </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-slate-800/50">
                    <Tabs defaultValue="todas" className="w-full">
                        <TabsList className="bg-slate-900/50 border border-slate-800 p-1 rounded-xl">
                            <TabsTrigger 
                                value="todas" 
                                onClick={() => setModoDificultad('todas')}
                                className="px-4 rounded-lg data-[state=active]:bg-slate-800 font-bold text-xs"
                            >
                                Todas ({cardsMateria.length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="facil" 
                                onClick={() => setModoDificultad('facil')}
                                className="px-4 rounded-lg data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 font-bold text-xs"
                            >
                                Fácil ({cardsMateria.filter(f => f.dificultad <= 2).length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="media" 
                                onClick={() => setModoDificultad('media')}
                                className="px-4 rounded-lg data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 font-bold text-xs"
                            >
                                Media ({cardsMateria.filter(f => f.dificultad === 3).length})
                            </TabsTrigger>
                            <TabsTrigger 
                                value="dificil" 
                                onClick={() => setModoDificultad('dificil')}
                                className="px-4 rounded-lg data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400 font-bold text-xs"
                            >
                                Difícil ({cardsMateria.filter(f => f.dificultad >= 4).length})
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                    
                    <div className="flex flex-wrap items-center gap-6 mt-6">
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={configuracion.audioHabilitado}
                                onCheckedChange={(checked) => setConfiguracion(prev => ({...prev, audioHabilitado: checked}))}
                            />
                            <Label className="text-sm text-slate-400 flex items-center gap-2">
                                <Volume2 className="w-4 h-4" /> Sonido
                            </Label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={configuracion.ordenAleatorio}
                                onCheckedChange={(checked) => setConfiguracion(prev => ({...prev, ordenAleatorio: checked}))}
                            />
                            <Label className="text-sm text-slate-400">Orden aleatorio</Label>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <Switch 
                                checked={configuracion.mostrarPista}
                                onCheckedChange={(checked) => setConfiguracion(prev => ({...prev, mostrarPista: checked}))}
                            />
                            <Label className="text-sm text-slate-400">Mostrar pistas</Label>
                        </div>
                    </div>
                </div>
            </Card>
            
            {cardsMateria.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {cardsMateria.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <Card className="bg-slate-900/40 border-slate-800 p-5 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group hover:scale-[1.02]"
                                onClick={() => {
                                    setIndiceActual(index);
                                    setModoEstudio(true);
                                }}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <Badge className={`${
                                        card.dificultad <= 2 ? 'bg-emerald-500/20 text-emerald-400' :
                                        card.dificultad === 3 ? 'bg-yellow-500/20 text-yellow-400' :
                                        'bg-rose-500/20 text-rose-400'
                                    } border-none text-[10px] font-black uppercase`}>
                                        {renderDificultad(card.dificultad || 3)}
                                    </Badge>
                                    
                                    {new Date(card.proxima_revision) <= new Date() && (
                                        <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[8px] font-black">
                                            REPASAR
                                        </Badge>
                                    )}
                                </div>
                                
                                <h4 className="text-sm font-bold text-white line-clamp-2 mb-3 group-hover:text-cyan-300 transition-colors">
                                    {card.pregunta}
                                </h4>
                                
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                                    {card.respuesta}
                                </p>
                                
                                <div className="flex items-center justify-between text-xs text-slate-600">
                                    <span>Revisión: {new Date(card.proxima_revision).toLocaleDateString()}</span>
                                    <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <Card className="bg-slate-900/20 border-slate-800/50 p-12 text-center rounded-3xl border-dashed">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Layers className="w-8 h-8 text-slate-600" />
                    </div>
                    <h3 className="text-xl font-black text-white mb-3">Mazo Vacío</h3>
                    <p className="text-slate-500 max-w-md mx-auto mb-6">
                        No hay flashcards en este mazo. Crea la primera para comenzar tu viaje de aprendizaje.
                    </p>
                    <Button 
                        onClick={onAddCard}
                        className="bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 px-8"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Crear Primera Flashcard
                    </Button>
                </Card>
            )}
        </div>
    );
}