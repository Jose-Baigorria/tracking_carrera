import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { CloudRain, Coffee, Wind, Volume2, VolumeX, Loader2, Sparkles, Zap, Guitar, GuitarIcon, Music, 
    Music2, 
    Brain, 
    Headphones, 
    Mic2,
    Waves } from "lucide-react";

// Estructura expandible: solo añade un objeto aquí para tener nuevos sonidos
const SOUNDS = [
    { 
        id: 'rain', 
        name: 'Lluvia', 
        icon: CloudRain, 
        url: '/audio/lluvia.mp3' 
    },
    { 
        id: 'lofi-coffee', 
        name: 'Lofi Café', 
        icon: Coffee, 
        url: '/audio/lofi_coffe.mp3' // Mantenemos el nombre del archivo con el typo del sistema
    },
    { 
        id: 'guitar', 
        name: 'Guitarra Acústica', 
        icon: Guitar, 
        url: '/audio/guitar.mp3'
    },
    { 
        id: 'piano', 
        name: 'Piano Clásico', 
        icon: Music, 
        url: '/audio/clasica_piano.mp3'
    },
    { 
        id: 'violin', 
        name: 'Violín de Grado', 
        icon: Music2, 
        url: '/audio/clasica_violin.mp3'
    },
    { 
        id: 'lofi-chill', 
        name: 'Lofi Chill', 
        icon: Headphones, 
        url: '/audio/lofi_chill.mp3'
    },
    { 
        id: 'lofi-jazzy', 
        name: 'Lofi Jazzy', 
        icon: Mic2, 
        url: '/audio/lofi_jazzy.mp3'
    },
    { 
        id: 'meditation', 
        name: 'Meditación Profunda', 
        icon: Brain, 
        url: '/audio/meditation.mp3'
    }
];

export default function AmbienteSonoro() {
    const [activeSound, setActiveSound] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [volume, setVolume] = useState([50]);
    const audioRef = useRef(new Audio());
    const fadeIntervalRef = useRef(null);

    // Función para bajar el volumen gradualmente antes de pausar o cambiar
    const fadeOutAndAction = (callback) => {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        
        const step = 0.05; // Cuánto baja el volumen en cada intervalo
        fadeIntervalRef.current = setInterval(() => {
            if (audioRef.current.volume > step) {
                audioRef.current.volume -= step;
            } else {
                audioRef.current.volume = 0;
                audioRef.current.pause();
                clearInterval(fadeIntervalRef.current);
                callback();
            }
        }, 30); // 30ms por paso (aprox 300ms de transición total)
    };

    const toggleSound = async (sound) => {
        const isSameSound = activeSound === sound.id;

        if (activeSound) {
            // Si ya hay algo sonando, hacemos fade out primero
            fadeOutAndAction(() => {
                if (isSameSound) {
                    setActiveSound(null);
                } else {
                    playNewSound(sound);
                }
            });
        } else {
            playNewSound(sound);
        }
    };

    const playNewSound = async (sound) => {
        try {
            setIsLoading(true);
            audioRef.current.src = sound.url;
            audioRef.current.loop = true; // JS standard (minúscula)
            audioRef.current.volume = volume[0] / 100;
            
            await audioRef.current.play();
            setActiveSound(sound.id);
        } catch (error) {
            console.error("Error al reproducir audio:", error);
            setActiveSound(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVolumeChange = (newVol) => {
        setVolume(newVol);
        if (!fadeIntervalRef.current) { // No interferir con el fade out
            audioRef.current.volume = newVol[0] / 100;
        }
    };

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button 
                    variant="outline" 
                    className={`rounded-2xl border-slate-800 bg-slate-900/50 transition-all duration-500 ${activeSound ? 'text-cyan-400 border-cyan-500/50 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'text-slate-400 hover:text-white'}`}
                >
                    {activeSound ? <Volume2 className="w-4 h-4 mr-2 animate-pulse" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    {activeSound ? 'Sonando' : 'Ambiente'}
                </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-72 bg-[#020617] border-slate-800 rounded-[2rem] p-6 shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3 text-cyan-500" />
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Atmósfera</p>
                    </div>
                    {isLoading && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-8">
                    {SOUNDS.map(s => (
                        <button 
                            key={s.id} 
                            onClick={() => toggleSound(s)}
                            disabled={isLoading}
                            className={`group relative p-4 rounded-2xl flex items-center gap-3 transition-all duration-300 ${
                                activeSound === s.id 
                                ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-500/50 shadow-lg' 
                                : 'bg-slate-900 text-slate-500 hover:bg-slate-800'
                            }`}
                        >
                            <s.icon className={`w-5 h-5 ${activeSound === s.id ? 'animate-bounce-slow' : 'group-hover:scale-110 transition-transform'}`} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{s.name}</span>
                            
                            {activeSound === s.id && (
                                <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-cyan-400 animate-ping" />
                            )}
                        </button>
                    ))}
                </div>

                <div className="space-y-4 bg-slate-900/40 p-4 rounded-2xl border border-white/5">
                    <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <span>Potencia</span>
                        <span className="text-cyan-400 font-mono">{volume}%</span>
                    </div>
                    <Slider 
                        value={volume} 
                        onValueChange={handleVolumeChange} 
                        max={100} 
                        step={1} 
                        className="cursor-pointer" 
                    />
                </div>

                {activeSound ? (
                    <p className="mt-6 text-[9px] text-center text-cyan-500/60 font-black uppercase tracking-[0.15em] animate-pulse">
                        Sincronizado con tu enfoque
                    </p>
                ) : (
                    <p className="mt-6 text-[9px] text-center text-slate-600 font-medium italic">
                        Selecciona un ambiente para empezar
                    </p>
                )}
            </PopoverContent>
        </Popover>
    );
}