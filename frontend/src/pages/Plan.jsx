import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/apiClient';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ArrowLeft, Zap, Calendar as CalendarIcon } from "lucide-react";
import { Link } from "react-router-dom";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '../css/calendar-custom.css';
import CountdownCircle from '../components/planificacion/CountdownCircle';
import ModalEventoPlan from '../components/planificacion/ModalEventoPlan';
import { differenceInDays, startOfDay } from 'date-fns';

export default function Plan() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [eventoAEditar, setEventoAEditar] = useState(null);

    // --- QUERIES CORREGIDAS (Añadido el llamado a la función) ---
    const { data: materias = [] } = useQuery({ 
        queryKey: ['materias'], 
        queryFn: () => apiClient.materias.list() 
    });
    const { data: inscripciones = [] } = useQuery({ 
        queryKey: ['inscripciones'], 
        queryFn: () => apiClient.inscripciones.list() 
    });
    const { data: eventos = [] } = useQuery({ 
        queryKey: ['planificacion'], 
        queryFn: () => apiClient.planificacion.list() 
    });

    // Mutación para Crear o Editar sincronizada con el backend de Python
    const mutation = useMutation({
        mutationFn: (data) => {
            if (data.id) {
                return apiClient.planificacion.update(data.id, data);
            }
            return apiClient.planificacion.create(data);
        },
        onSuccess: () => {
            // Invalidamos múltiples claves para que el Dashboard y las Notas también se actualicen
            queryClient.invalidateQueries(['planificacion']);
            queryClient.invalidateQueries(['notas']);
            queryClient.invalidateQueries(['dashboard-stats']);
            handleCloseModal();
        }
    });

    const handleCloseModal = () => {
        setModalOpen(false);
        setEventoAEditar(null);
    };

    const handleEdit = (id) => {
        const ev = eventos.find(e => e.id === id);
        if (ev) {
            setEventoAEditar(ev);
            setModalOpen(true);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Estás seguro de eliminar este evento planificado?")) {
            try {
                await apiClient.planificacion.delete(id);
                queryClient.invalidateQueries(['planificacion', 'notas']);
            } catch (error) {
                console.error("Error al eliminar:", error);
            }
        }
    };

    // FUNCIÓN DE FECHA LOCAL: Crucial para evitar desfases horarios
    const getFechaLocal = (fechaStr) => {
        if (!fechaStr) return new Date();
        const [year, month, day] = fechaStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    const hoy = startOfDay(new Date());

    // Filtrado de materias usando el ID (UUID)
    const materiasFiltradas = materias.filter(m => 
        inscripciones.some(i => String(i.materia_id) === String(m.id) && ['cursando', 'regular'].includes(i.estado))
    );

    const todosLosEventos = eventos.map(ev => ({
        ...ev,
        objFecha: getFechaLocal(ev.fecha),
        diasRestantes: differenceInDays(getFechaLocal(ev.fecha), hoy)
    })).sort((a, b) => a.objFecha - b.objFecha);

    const eventosFuturos = todosLosEventos.filter(ev => ev.diasRestantes >= 0);

    return (
        <div className="min-h-screen bg-[#020617] p-4 md:p-12 text-white font-sans">
            <div className="max-w-6xl mx-auto space-y-10">
                
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <Button asChild variant="ghost" className="mb-4 -ml-4 text-slate-500 hover:text-rose-400 p-0 hover:bg-transparent transition-colors">
                            <Link to="/"><ArrowLeft className="mr-2 h-4 w-4" /> Volver al Dashboard</Link>
                        </Button>
                        <h1 className="text-7xl font-black tracking-tighter uppercase leading-none">
                            Planificación<span className="text-rose-600">.</span>
                        </h1>
                    </div>
                    <Button 
                        onClick={() => { setEventoAEditar(null); setModalOpen(true); }} 
                        className="bg-rose-600 hover:bg-rose-500 h-16 px-10 rounded-2xl font-black text-lg shadow-xl shadow-rose-900/20 transition-all hover:scale-105 active:scale-95"
                    >
                        <Plus className="mr-2 w-6 h-6" strokeWidth={3} /> AGENDAR EVENTO
                    </Button>
                </header>

                {/* Contenedor del Calendario con estética unificada */}
                <section className="bg-slate-900/40 border border-white/5 rounded-[3rem] p-10 backdrop-blur-md shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-10 opacity-5">
                        <CalendarIcon className="w-64 h-64 text-white" />
                    </div>
                    <div className="calendar-container relative z-10">
                        <Calendar 
                            className="w-full bg-transparent border-none text-white"
                            tileClassName={({ date, view }) => {
                                if (view === 'month') {
                                    const d = date.getDate().toString().padStart(2, '0');
                                    const m = (date.getMonth() + 1).toString().padStart(2, '0');
                                    const y = date.getFullYear();
                                    const key = `${y}-${m}-${d}`;
                                    const ev = eventos.find(e => e.fecha === key);
                                    return ev ? 'has-event-custom' : '';
                                }
                            }}
                            tileContent={({ date, view }) => {
                                if (view === 'month') {
                                    const d = date.getDate().toString().padStart(2, '0');
                                    const m = (date.getMonth() + 1).toString().padStart(2, '0');
                                    const y = date.getFullYear();
                                    const key = `${y}-${m}-${d}`;
                                    const ev = eventos.find(e => e.fecha === key);
                                    if (ev) {
                                        return (
                                            <div 
                                                className="absolute inset-1 rounded-xl border-2 shadow-lg" 
                                                style={{ 
                                                    borderColor: ev.color, 
                                                    backgroundColor: `${ev.color}10`,
                                                    boxShadow: `0 0 15px ${ev.color}20`
                                                }} 
                                            />
                                        );
                                    }
                                }
                                return null;
                            }}
                        />
                    </div>
                </section>

                <section className="space-y-8">
                    <div className="flex items-center justify-between px-6">
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-amber-500/10 rounded-lg">
                                <Zap className="text-amber-500 w-6 h-6" />
                            </div>
                            <h2 className="text-lg font-black uppercase tracking-[0.4em] text-slate-500">Próximos Eventos</h2>
                        </div>
                        <Badge variant="outline" className="border-slate-800 text-slate-500 font-bold px-4 py-1 rounded-full">
                            {eventosFuturos.length} EVENTOS
                        </Badge>
                    </div>
                    
                    {/* Grid de Countdown Circles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {eventosFuturos.length > 0 ? (
                            eventosFuturos.map((ev, idx) => (
                                <div key={ev.id} className="animate-in fade-in slide-in-from-bottom-4" style={{ animationDelay: `${idx * 100}ms` }}>
                                    <CountdownCircle 
                                        id={ev.id}
                                        dias={ev.diasRestantes} 
                                        nombre={ev.titulo} 
                                        tipo={ev.tipo}
                                        color={ev.color} 
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                </div>
                            ))
                        ) : (
                            <Card className="col-span-full bg-slate-900/20 border-slate-800 border-dashed p-20 text-center rounded-[3rem]">
                                <p className="text-slate-600 font-bold uppercase tracking-widest text-sm italic">Tu agenda está despejada por ahora ✨</p>
                            </Card>
                        )}
                    </div>
                </section>
            </div>

            <ModalEventoPlan 
                open={modalOpen} 
                onClose={handleCloseModal} 
                onSave={(data) => mutation.mutate(data)}
                materiasDisponibles={materiasFiltradas}
                eventoEditar={eventoAEditar}
            />
        </div>
    );
}