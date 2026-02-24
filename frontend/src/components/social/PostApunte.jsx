import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
    FileText, Download, Eye, Heart, 
    Share2, MoreVertical, FileCode, FileSpreadsheet, 
    File as FileIcon, ExternalLink 
} from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function PostApunte({ apunte, onLike }) {
    // 1. Lógica de detección de archivo
    const esArchivo = apunte.contenido?.startsWith("FILE:");
    const nombreArchivo = esArchivo ? apunte.contenido.replace("FILE:", "") : "";
    
    // 2. Selección de icono según formato
    const getFileIcon = (formato) => {
        const fmt = formato?.toLowerCase();
        if (fmt === 'pdf') return <FileText className="w-8 h-8 text-rose-500" />;
        if (['doc', 'docx'].includes(fmt)) return <FileIcon className="w-8 h-8 text-blue-500" />;
        if (['xls', 'xlsx'].includes(fmt)) return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
        return <FileCode className="w-8 h-8 text-cyan-500" />;
    };

    return (
        <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[2rem] backdrop-blur-md hover:border-white/10 transition-all group">
            {/* Header del Post */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-purple-500/20">
                        <AvatarImage src={apunte.usuario?.avatar_url} />
                        <AvatarFallback className="bg-slate-800 font-black">{apunte.usuario?.nombre[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter leading-none mb-1">{apunte.titulo}</h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[8px] border-cyan-500/30 text-cyan-400 font-black uppercase">{apunte.materia?.nombre}</Badge>
                            <span className="text-[10px] text-slate-500 font-bold">por {apunte.usuario?.nombre} {apunte.usuario?.apellido}</span>
                            <span className="text-[10px] text-slate-700">•</span>
                            <span className="text-[10px] text-slate-500 font-medium">
                                {formatDistanceToNow(new Date(apunte.fecha_compartido), { addSuffix: true, locale: es })}
                            </span>
                        </div>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-slate-600 hover:text-white"><MoreVertical className="w-4 h-4" /></Button>
            </div>

            {/* CONTENIDO: Tarjeta de Archivo o Texto */}
            <div className="mb-6">
                {esArchivo ? (
                    <div className="bg-slate-950/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between group/file hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-slate-900 rounded-xl shadow-inner group-hover/file:scale-110 transition-transform">
                                {getFileIcon(apunte.formato)}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-black text-slate-200 truncate max-w-[300px] uppercase tracking-tight">{nombreArchivo}</p>
                                <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Recurso {apunte.formato} • Verificado</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button size="sm" variant="ghost" className="h-10 w-10 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/10">
                                <Eye className="w-5 h-5" />
                            </Button>
                            {/* El botón de descarga simula el click en el enlace real */}
                            <Button 
                                size="sm" 
                                className="h-10 bg-white text-black hover:bg-cyan-500 hover:text-white rounded-xl font-black px-4 transition-all"
                                onClick={() => {
                                    // Obtenemos el nombre real del archivo guardado
                                    const fileId = apunte.contenido.replace("FILE:", "");
                                    // Abrimos la ruta de descarga del backend
                                    window.open(`http://127.0.0.1:8000/api/social/apuntes/descargar/${fileId}`, "_blank");
                                }}
                            >
                                <Download className="w-4 h-4 mr-2" /> DESCARGAR
                            </Button>
                        </div>
                    </div>
                ) : (
                    <p className="text-slate-400 text-sm leading-relaxed pl-2 border-l-2 border-slate-800">{apunte.descripcion}</p>
                )}
            </div>

            {/* Footer de Interacción */}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-6">
                    <button onClick={() => onLike(apunte.id)} className="flex items-center gap-2 text-slate-500 hover:text-rose-500 transition-colors group/stat">
                        <Heart className="w-4 h-4 group-hover/stat:fill-rose-500" />
                        <span className="text-[10px] font-black">{apunte.total_calificaciones || 0}</span>
                    </button>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Download className="w-4 h-4" />
                        <span className="text-[10px] font-black">{apunte.veces_descargado || 0}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                        <Eye className="w-4 h-4" />
                        <span className="text-[10px] font-black">{apunte.veces_visto || 0}</span>
                    </div>
                </div>
                <Button variant="ghost" className="text-[10px] font-black uppercase text-slate-500 hover:text-cyan-400 gap-2">
                    <Share2 className="w-3.5 h-3.5" /> Compartir
                </Button>
            </div>
        </Card>
    );
}