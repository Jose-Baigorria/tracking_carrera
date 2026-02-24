import React from 'react';
import { motion } from "framer-motion";

export default function CuadroCorrelativas({ materia, todasLasMaterias, correlatividades }) {
    const materiaIdActual = String(materia.id);
    const requisitos = correlatividades.filter(c => String(c.materia_id) === materiaIdActual);
    const soyRequisitoDe = correlatividades.filter(c => String(c.correlativa_id) === materiaIdActual);

    const getNombre = (id) => todasLasMaterias.find(m => String(m.id) === String(id))?.nombre || "Materia";

    const ListBlock = ({ lista, tipo, color, bullet, label, isHabilitada = false }) => {
        const items = lista.filter(r => r.tipo === tipo);
        return (
            <div className="p-4 flex flex-col h-full">
                <p className={`${color} font-black mb-3 uppercase text-[9px] tracking-widest`}>{label}:</p>
                <div className="space-y-1 flex-1">
                    {items.length > 0 ? items.map((r, i) => (
                        <div key={i} className="text-slate-200 flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/50 text-[10px]">
                            <span className={`${color} font-bold text-lg leading-none`}>{bullet}</span> 
                            {getNombre(isHabilitada ? r.materia_id : r.correlativa_id)}
                        </div>
                    )) : <div className="text-slate-700 italic text-[10px] pl-2">Ninguna</div>}
                </div>
            </div>
        );
    };

    return (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-6 overflow-hidden">
            <div className="bg-slate-800 border border-slate-800 rounded-2xl overflow-hidden">
                {/* Cabecera Principal */}
                <div className="grid grid-cols-2 bg-slate-950 border-b border-slate-800">
                    <div className="p-3 text-slate-500 font-black uppercase text-center text-[10px] border-r border-slate-800">Requisitos para cursar</div>
                    <div className="p-3 text-slate-500 font-black uppercase text-center text-[10px]">Materias que habilitas</div>
                </div>

                {/* FILA 1: REGULARES (Alineadas) */}
                <div className="grid grid-cols-2 border-b border-slate-800/50 bg-slate-900/60">
                    <div className="border-r border-slate-800/50">
                        <ListBlock lista={requisitos} tipo="regular" color="text-cyan-400" bullet="•" label="Necesitas Regularizar las siguientes materias para poder cursar está" />
                    </div>
                    <div>
                        <ListBlock lista={soyRequisitoDe} tipo="regular" color="text-emerald-400" bullet="→" label="Necesitas Regularizar está materia para poder cursar las siguientes" isHabilitada={true} />
                    </div>
                </div>

                {/* FILA 2: APROBADAS (Alineadas) */}
                <div className="grid grid-cols-2 bg-slate-900/30">
                    <div className="border-r border-slate-800/50">
                        <ListBlock lista={requisitos} tipo="aprobada" color="text-amber-400" bullet="•" label="Necesitas Aprobar las siguientes materias para poder cursar está" />
                    </div>
                    <div>
                        <ListBlock lista={soyRequisitoDe} tipo="aprobada" color="text-emerald-600" bullet="★" label="Necesitas Aprobar está materia para poder cursar las siguientes" isHabilitada={true} />
                    </div>
                </div>
            </div>
        </motion.div>
    );
}