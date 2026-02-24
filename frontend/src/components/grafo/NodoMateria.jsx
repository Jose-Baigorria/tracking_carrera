import React from 'react';
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Lock, CheckCircle2, BookOpen, Circle, Calculator, Shapes, Atom, Languages, Binary, Code2, Cpu, Building2, Zap, Users, FileCode, Braces, HardDrive, Network, TrendingUp, DollarSign, Database, Laptop, Radio, Sigma, Pen, Award, Scale, Globe, Search, Activity, Cog, LayoutDashboard, Brain, BarChart3, ClipboardList, Briefcase, Shield, Trophy } from "lucide-react";

export default function NodoMateria({ materia, inscripcion, onClick, posX, posY, isElectiva = false }) {
    const iconMap = {
        Calculator, Shapes, Atom, Languages, Binary, Code2, Cpu, Building2, Zap, Users,
        FileCode, Braces, HardDrive, Network, TrendingUp, DollarSign, Database, Laptop,
        Radio, Sigma, Pen, Award, Scale, Globe, Search, Activity, Cog, LayoutDashboard,
        Brain, BarChart3, ClipboardList, Briefcase, Shield, Trophy, Circle
    };
    
    const Icon = iconMap[materia.icono] || Circle;
    
    const getEstado = () => {
        if (!inscripcion) return 'bloqueada';
        return inscripcion.estado;
    };
    
    const estado = getEstado();
    
    const estilosPorEstado = {
        bloqueada: {
            bg: 'bg-slate-800/50',
            border: 'border-slate-700',
            icon: 'text-slate-600',
            texto: 'text-slate-500',
            IconEstado: Lock
        },
        disponible: {
            bg: 'bg-cyan-900/30',
            border: 'border-cyan-600/50',
            icon: 'text-cyan-400',
            texto: 'text-cyan-200',
            IconEstado: Circle
        },
        cursando: {
            bg: 'bg-blue-900/40',
            border: 'border-blue-500',
            icon: 'text-blue-400',
            texto: 'text-white',
            IconEstado: BookOpen
        },
        regular: {
            bg: 'bg-amber-900/40',
            border: 'border-amber-500',
            icon: 'text-amber-400',
            texto: 'text-white',
            IconEstado: CheckCircle2
        },
        aprobada: {
            bg: 'bg-green-900/40',
            border: 'border-green-500',
            icon: 'text-green-400',
            texto: 'text-white',
            IconEstado: CheckCircle2
        }
    };
    
    const estilo = estilosPorEstado[estado] || estilosPorEstado.bloqueada;
    const IconEstado = estilo.IconEstado;
    
    return (
        <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            whileHover={{ scale: estado !== 'bloqueada' ? 1.05 : 1 }}
            style={isElectiva ? {} : {
                position: 'absolute',
                left: posX,
                top: posY,
                transform: 'translate(-50%, -50%)'
            }}
            onClick={() => estado !== 'bloqueada' && onClick(materia)}
            className={`
                ${estilo.bg} ${estilo.border} 
                border-2 rounded-xl p-4 w-48
                cursor-pointer transition-all
                ${estado === 'bloqueada' ? 'opacity-50 cursor-not-allowed' : isElectiva ? 'hover:shadow-lg hover:shadow-purple-500/20' : 'hover:shadow-lg hover:shadow-cyan-500/20'}
            `}
        >
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg bg-slate-900/50 ${estilo.icon}`}>
                    <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                        <Badge 
                            variant="outline" 
                            className="text-[10px] px-1 py-0"
                            style={{borderColor: materia.color || '#a855f7', color: materia.color || '#a855f7'}}
                        >
                            {materia.nivel === 'E' ? 'Electiva' : `N${materia.nivel}`}
                        </Badge>
                        <IconEstado className={`w-4 h-4 ${estilo.icon}`} />
                    </div>
                    <h4 className={`text-xs font-semibold leading-tight ${estilo.texto}`}>
                        {materia.nombre}
                    </h4>
                    {materia.es_integradora && (
                        <Badge variant="outline" className="mt-2 text-[9px] px-1 py-0 bg-purple-500/20 border-purple-400 text-purple-300">
                            Integradora
                        </Badge>
                    )}
                    {materia.creditos && (
                        <Badge variant="outline" className="mt-2 text-[9px] px-1 py-0 bg-purple-500/20 border-purple-400 text-purple-300">
                            {materia.creditos} créditos
                        </Badge>
                    )}
                </div>
            </div>
        </motion.div>
    );
}