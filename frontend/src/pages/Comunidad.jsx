import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Users, Search, MessageSquare, FileText, Globe, Plus, ArrowRight,
    Zap, Star, ShieldCheck, Hash, Loader2, TrendingUp, Filter, ArrowLeft
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import GroupCard from '../components/social/GroupCard';
import ParticipantSearch from '../components/social/ParticipantSearch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// --- SUB-COMPONENTE: Tarjeta de Métrica ---
const StatCard = ({ label, val, icon: Icon, color, trend }) => (
    <Card className="bg-slate-900/40 border-white/5 p-6 rounded-[2rem] backdrop-blur-md hover:border-white/10 transition-all group hover:scale-[1.02]">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-800/50 rounded-xl group-hover:scale-110 transition-transform">
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <div className="flex-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{label}</p>
                <p className="text-2xl font-black text-white">{val}</p>
                <p className="text-[9px] text-slate-600 font-bold uppercase mt-1">{trend}</p>
            </div>
        </div>
    </Card>
);

export default function Comunidad() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [busqueda, setBusqueda] = useState("");
    const [showCrearGrupo, setShowCrearGrupo] = useState(false);
    const [nuevoGrupo, setNuevoGrupo] = useState({ nombre: '', descripcion: '', materia_id: '', max_integrantes: 10, privado: false });

    // --- DATA FETCHING ---
    const { data: grupos = [], isLoading: loadingGrupos } = useQuery({ 
        queryKey: ['social-grupos'], 
        queryFn: () => apiClient.social.grupos.list(),
        refetchOnWindowFocus: true
    });

    const { data: inscripciones = [] } = useQuery({ queryKey: ['inscripciones'], queryFn: () => apiClient.inscripciones.list() });
    const { data: materias = [] } = useQuery({ queryKey: ['materias'], queryFn: () => apiClient.materias.list() });
    const { data: estadisticas, isLoading: loadingStats } = useQuery({ queryKey: ['social-estadisticas'], queryFn: () => apiClient.social.estadisticas() });
    const { data: tendencias = [] } = useQuery({ queryKey: ['social-tendencias'], queryFn: () => apiClient.social.tendencias() });

   
    const crearGrupoMutation = useMutation({
        mutationFn: (data) => apiClient.social.grupos.create(data),
        onSuccess: (res) => {
            queryClient.invalidateQueries(['social-grupos']);
            setShowCrearGrupo(false);
            
            // CORRECCIÓN: Verificamos que res y res.grupo existan antes de navegar
            if (res?.grupo?.id) {
                navigate(`/comunidad/grupo/${res.grupo.id}`);
            } else {
                console.error("El backend no devolvió el ID del grupo esperado", res);
                navigate('/comunidad'); // Backup por si falla
            }
        },
        onError: (err) => {
            const errorMsg = err.response?.data?.detail || "Error en el despliegue.";
            alert(`ALERTA: ${errorMsg}`);
        }
    });

    const handleCrearGrupo = (e) => {
        e.preventDefault(); // Evitamos recarga de página
        if (!nuevoGrupo.nombre || !nuevoGrupo.materia_id) return;
        
        // Ejecutamos la mutación con los datos limpios
        crearGrupoMutation.mutate({
            nombre: nuevoGrupo.nombre,
            descripcion: nuevoGrupo.descripcion,
            materia_id: String(nuevoGrupo.materia_id),
            max_integrantes: nuevoGrupo.max_integrantes,
            privado: nuevoGrupo.privado
        });
    };

    // --- LÓGICA DE FILTRADO ---
    const misGrupos = grupos.filter(g => g.eres_miembro);
    const materiasCursandoIds = inscripciones.filter(i => i.estado === 'cursando').map(i => String(i.materia_id));
    const gruposSugeridos = grupos.filter(g => materiasCursandoIds.includes(String(g.materia_id)) && !g.eres_miembro);

    const renderGroupGrid = (items) => (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {items.map((grupo, idx) => (
                <motion.div key={grupo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}>
                    <GroupCard grupo={grupo} mine={grupo.eres_miembro} />
                </motion.div>
            ))}
        </div>
    );

    const materiasHabilitadas = materias.filter(m => 
        inscripciones.some(i => 
            String(i.materia_id) === String(m.id) && 
            ['cursando', 'regular'].includes(i.estado)
        )
    );

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 p-6 md:p-12 font-sans overflow-hidden relative">
            {/* Background Effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header Section */}
                <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
                    <div className="space-y-2">
                        <Button asChild variant="link" className="p-0 h-auto text-slate-500 hover:text-cyan-400">
                            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4"/> Dashboard</Link>
                        </Button>
                        <div className="flex items-center gap-4">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }} className="p-3 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl shadow-2xl">
                                <Globe className="h-8 w-8 text-white" />
                            </motion.div>
                            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
                                Hub <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Social</span>
                            </h1>
                        </div>
                        <p className="text-slate-500 text-lg font-medium tracking-tight">Red de {estadisticas?.total_usuarios || 0} ingenieros colaborando en tiempo real.</p>
                    </div>

                    <div className="flex items-center gap-4 w-full lg:w-auto">
                        <div className="flex-1 sm:w-80"><ParticipantSearch /></div>
                        <Button onClick={() => setShowCrearGrupo(true)} className="bg-white text-black hover:bg-slate-200 h-14 px-8 rounded-2xl font-black uppercase tracking-widest transition-all">
                            <Plus className="mr-2 w-5 h-5" strokeWidth={3} /> CREAR GRUPO
                        </Button>
                    </div>
                </header>

                {/* Metrics Dashboard */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                    <StatCard label="Colegas Activos" val={estadisticas?.total_usuarios || 0} icon={Users} color="text-cyan-400"  />
                    <StatCard label="Apuntes" val={estadisticas?.total_apuntes || 0} icon={FileText} color="text-purple-400" />
                    <StatCard label="Grupos" val={estadisticas?.total_grupos || 0} icon={Hash} color="text-rose-400"  />
                    <StatCard label="Materia Top" val={estadisticas?.materia_popular?.nombre?.split(' ')[0] || 'N/A'} icon={TrendingUp} color="text-amber-400" trend={`${estadisticas?.materia_popular?.total_apuntes || 0} archivos`} />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                    <div className="lg:col-span-2 space-y-8">
                        <Tabs defaultValue="mis-grupos" className="w-full">
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-slate-900/30 p-2 rounded-[1.5rem] border border-white/5">
                                <TabsList className="bg-transparent border-none">
                                    <TabsTrigger value="mis-grupos" className="px-8 rounded-xl data-[state=active]:bg-purple-600 font-black text-[10px] uppercase">MIS GRUPOS ({misGrupos.length})</TabsTrigger>
                                    <TabsTrigger value="descubrir" className="px-8 rounded-xl data-[state=active]:bg-cyan-600 font-black text-[10px] uppercase">DESCUBRIR ({gruposSugeridos.length})</TabsTrigger>
                                </TabsList>
                                <Button variant="ghost" asChild className="text-slate-500 hover:text-white text-xs font-black uppercase tracking-[0.2em]">
                                    <Link to="/comunidad/muro">Ver Muro <ArrowRight className="ml-2 w-4 h-4" /></Link>
                                </Button>
                            </div>

                            <TabsContent value="mis-grupos">
                                {loadingGrupos ? <Loader2 className="w-10 h-10 animate-spin text-purple-500 mx-auto py-20" /> : 
                                 misGrupos.length > 0 ? renderGroupGrid(misGrupos) : 
                                 <div className="py-20 text-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-500 font-bold uppercase tracking-widest">No perteneces a grupos todavía</div>}
                            </TabsContent>

                            <TabsContent value="descubrir">
                                {gruposSugeridos.length > 0 ? renderGroupGrid(gruposSugeridos) : 
                                 <div className="py-20 text-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] text-slate-500 font-bold uppercase tracking-widest">No hay sugerencias nuevas</div>}
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Sidebar: Tendencias y Mentoría */}
                    <aside className="space-y-8">
                        <Card className="bg-gradient-to-b from-slate-900/60 to-slate-950/60 border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
                            <CardHeader className="p-8 border-b border-white/5"><CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-2"><TrendingUp className="text-rose-500 w-4 h-4" /> Tendencias UTN</CardTitle></CardHeader>
                            <CardContent className="p-8 space-y-6">
                                {tendencias.map((trend, i) => (
                                    <div key={trend.tag} className="flex justify-between items-center group cursor-pointer hover:translate-x-2 transition-transform">
                                        <div className="flex items-center gap-3">
                                            <span className="text-slate-800 font-black italic text-xl">#{i+1}</span>
                                            <span className="text-sm font-bold text-slate-300 group-hover:text-cyan-400 transition-colors">{trend.tag}</span>
                                        </div>
                                        <Badge className="bg-slate-800 text-slate-500 border-none text-[8px] font-black uppercase">{trend.posts} POSTS</Badge>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-indigo-900/20 to-cyan-900/10 border-cyan-500/20 rounded-[2.5rem] p-8 text-center space-y-6 relative overflow-hidden group">
                            <div className="absolute -top-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full group-hover:scale-150 transition-transform duration-700" />
                            <div className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl"><Star className="w-8 h-8 text-white" /></div>
                            <div className="space-y-2">
                                <h4 className="text-white font-black uppercase text-xs tracking-widest">Programa de Mentores</h4>
                                <p className="text-slate-500 text-[10px] leading-relaxed font-medium">Ayuda a tus colegas con apuntes verificados y sube en el ranking de ingeniería.</p>
                            </div>
                            <Button onClick={() => navigate('/comunidad/muro')} className="w-full h-12 bg-cyan-600 hover:bg-cyan-500 font-black uppercase text-[10px] rounded-xl tracking-widest shadow-lg shadow-cyan-900/20">Subir Material</Button>
                        </Card>
                    </aside>
                </div>
            </div>

            {/* Modal de Creación */}
            <Dialog open={showCrearGrupo} onOpenChange={setShowCrearGrupo}>
                <DialogContent className="bg-[#020617] border-slate-800 text-white max-w-2xl rounded-3xl p-10 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 to-cyan-500" />
                    <DialogHeader><DialogTitle className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4"><Users className="h-8 w-8 text-purple-500" /> Crear Nueva Alianza</DialogTitle></DialogHeader>
                    <div className="space-y-6 mt-8">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Identificador del Grupo</Label>
                                <Input className="bg-slate-900 border-slate-800 h-12 rounded-xl" placeholder="ej: Squad Sistemas 2K1" value={nuevoGrupo.nombre} onChange={e => setNuevoGrupo({...nuevoGrupo, nombre: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                    Materia Vinculada
                                </Label>
                                <Select onValueChange={(val) => setNuevoGrupo({...nuevoGrupo, materia_id: val})}>
                                    <SelectTrigger className="bg-slate-900 border-slate-800 h-12 rounded-xl">
                                        <SelectValue placeholder="Seleccionar..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-slate-800 text-white shadow-2xl">
                                        {materiasHabilitadas.length > 0 ? (
                                            materiasHabilitadas.map(m => (
                                                <SelectItem key={m.id} value={String(m.id)}>
                                                    {m.nombre}
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-4 text-[10px] text-slate-500 font-bold uppercase text-center">
                                                No tienes materias habilitadas para crear grupos
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                <p className="text-[9px] text-slate-600 font-bold px-1 mt-1">
                                    * Solo se muestran materias que estás cursando o regulares.
                                </p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brief de Colaboración</Label>
                            <Textarea className="bg-slate-900 border-slate-800 rounded-xl h-24 resize-none" placeholder="¿Cuál es el objetivo del grupo?" value={nuevoGrupo.descripcion} onChange={e => setNuevoGrupo({...nuevoGrupo, descripcion: e.target.value})} />
                        </div>
                        <Button onClick={handleCrearGrupo} className="w-full h-14 bg-gradient-to-r from-purple-600 to-indigo-600 font-black uppercase rounded-xl tracking-widest shadow-2xl">
                            {crearGrupoMutation.isLoading ? <Loader2 className="animate-spin" /> : "DESPLEGAR GRUPO"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}