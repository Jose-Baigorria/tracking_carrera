import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Trophy, Star, Check, Calendar, Info, Share2, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function LogrosInsignias({ logros, categorias }) {
  const [selectedLogro, setSelectedLogro] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Función para parsear datos_contexto si vienen como string JSON
  const renderContextData = (context) => {
    if (!context) return null;
    try {
      const data = typeof context === 'string' ? JSON.parse(context) : context;
      return Object.entries(data).map(([key, value]) => (
        <div key={key} className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg border border-slate-800">
          <span className="text-slate-500 text-xs uppercase font-bold">{key.replace('_', ' ')}</span>
          <span className="text-cyan-400 font-mono text-sm">{value}</span>
        </div>
      ));
    } catch (e) {
      return <p className="text-slate-400 text-sm italic">{context}</p>;
    }
  };

  return (
    <TooltipProvider delayDuration={100}>
      <div className="space-y-16 pb-20">
        {categorias.map((cat) => {
          const logrosCat = logros.filter(l => l.categoria === cat.nombre);
          if (logrosCat.length === 0) return null;

          const desbloqueadosCount = logrosCat.filter(l => l.desbloqueado).length;
          const porcentajeCat = (desbloqueadosCount / logrosCat.length) * 100;

          return (
            <motion.div key={cat.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              {/* Cabecera de Categoría con Estilo Premium */}
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800/50 pb-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{cat.icono}</div>
                  <div>
                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{cat.nombre}</h2>
                    <p className="text-slate-500 font-medium text-sm">{cat.descripcion}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Progreso</span>
                    <Badge variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 font-black">
                      {desbloqueadosCount} / {logrosCat.length}
                    </Badge>
                  </div>
                  <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <motion.div 
                      initial={{ width: 0 }} 
                      animate={{ width: `${porcentajeCat}%` }}
                      className="h-full bg-gradient-to-r from-cyan-600 to-blue-500" 
                    />
                  </div>
                </div>
              </div>

              {/* Grid de Logros */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {logrosCat.map((logro) => (
                  <Tooltip key={logro.id}>
                    <TooltipTrigger asChild>
                      <motion.div whileHover={logro.desbloqueado ? { scale: 1.05, y: -5 } : {}}>
                        <Card 
                          onClick={() => logro.desbloqueado && (setSelectedLogro(logro), setIsModalOpen(true))}
                          className={`group relative p-4 flex flex-col items-center text-center h-full border-2 transition-all duration-500 ${
                            logro.desbloqueado 
                            ? 'bg-slate-900/40 border-slate-800 hover:border-cyan-500/50 cursor-pointer shadow-2xl shadow-cyan-900/10' 
                            : 'bg-slate-950/20 border-slate-900 opacity-40 grayscale cursor-help'
                          } rounded-[2rem] overflow-hidden`}
                        >
                          {/* Efecto de Brillo para Desbloqueados */}
                          {logro.desbloqueado && (
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}

                          <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
                            {!logro.desbloqueado ? (
                              <div className="absolute inset-0 z-20 flex items-center justify-center">
                                <div className="bg-slate-950/80 p-3 rounded-2xl border border-slate-800 backdrop-blur-sm">
                                  <Lock className="w-6 h-6 text-slate-600" />
                                </div>
                              </div>
                            ) : (
                              <motion.div 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }} 
                                className="absolute -top-1 -right-1 z-30 bg-green-500 rounded-full p-1 shadow-lg border-2 border-slate-900"
                              >
                                <Check className="w-3 h-3 text-white" strokeWidth={4} />
                              </motion.div>
                            )}
                            
                            <img 
                              src={`/assets/logros/${logro.id}.png`} 
                              alt={logro.nombre}
                              className="w-full h-full object-contain drop-shadow-2xl"
                              onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                            />
                            <div className="hidden w-full h-full items-center justify-center text-4xl">{logro.icono}</div>
                          </div>

                          <h4 className={`text-xs font-black leading-tight uppercase tracking-tight mb-2 ${logro.desbloqueado ? 'text-white' : 'text-slate-600'}`}>
                            {logro.nombre}
                          </h4>
                          
                          {logro.desbloqueado && (
                            <div className="flex items-center gap-1 text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                              <Star className="w-2.5 h-2.5 fill-current" />
                              <span className="text-[10px] font-black">{logro.puntos}</span>
                            </div>
                          )}
                        </Card>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-slate-900 border-slate-800 text-white p-3 rounded-xl shadow-2xl">
                      <p className="text-xs font-bold text-cyan-400 mb-1">{logro.nombre}</p>
                      <p className="text-[10px] text-slate-300 max-w-[150px] leading-relaxed">{logro.descripcion}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* MODAL DE DETALLE (LOGRO DESBLOQUEADO) */}
        <AnimatePresence>
          {selectedLogro && (
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogContent className="bg-[#020617] border-slate-800 text-white max-w-lg rounded-[2.5rem] p-0 overflow-hidden shadow-[0_0_50px_rgba(6,182,212,0.15)]">
                {/* Header con Imagen de Fondo */}
                <div className="relative h-48 bg-gradient-to-b from-cyan-900/20 to-transparent flex items-center justify-center border-b border-slate-800/50">
                  <div className="absolute inset-0 bg-[url('/assets/grid-pattern.svg')] opacity-10" />
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -10 }} 
                    animate={{ scale: 1, rotate: 0 }}
                    className="relative w-32 h-32 z-10"
                  >
                    <img src={`/assets/logros/${selectedLogro.id}.png`} alt="" className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(6,182,212,0.4)]" />
                    <div className="hidden w-full h-full items-center justify-center text-7xl">{selectedLogro.icono}</div>
                  </motion.div>
                </div>

                <div className="p-8 space-y-6">
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.3em]">Logro Desbloqueado</span>
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                    </div>
                    <h2 className="text-3xl font-black tracking-tighter">{selectedLogro.nombre}</h2>
                    <p className="text-slate-400 font-medium">{selectedLogro.descripcion}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-center">
                      <Calendar className="w-5 h-5 text-slate-500 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Obtenido el</p>
                      <p className="text-sm font-bold text-white">{formatDate(selectedLogro.fecha_desbloqueo) || 'Fecha desconocida'}</p>
                    </div>
                    <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 text-center">
                      <Trophy className="w-5 h-5 text-amber-500 mx-auto mb-2" />
                      <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">Recompensa</p>
                      <p className="text-sm font-bold text-amber-400">+{selectedLogro.puntos} XP</p>
                    </div>
                  </div>

                  {/* Datos de Contexto extraídos de la DB */}
                  {selectedLogro.datos_contexto && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
                        <Info className="w-3 h-3" /> Evidencia de Desbloqueo
                      </div>
                      <div className="space-y-2">
                        {renderContextData(selectedLogro.datos_contexto)}
                      </div>
                    </div>
                  )}

                  <Button className="w-full bg-cyan-600 hover:bg-cyan-500 h-14 rounded-2xl font-black text-lg shadow-xl shadow-cyan-900/20">
                    COMPARTIR LOGRO <Share2 className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}