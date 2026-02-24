import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from '@/api/apiClient';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, User, Mail, Lock, Book } from "lucide-react";

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '', apellido: '', email: '', 
        password: '', legajo: '', carrera_id: ''
    });
    const navigate = useNavigate();

    // Cargar carreras para el selector
    const { data: carreras = [] } = useQuery({
        queryKey: ['carreras'],
        queryFn: () => apiClient.materias.listCarreras() // Debes agregar este endpoint
    });

    const { register } = useAuth(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Llamar a la función del contexto
        const result = await register(formData);
        
        if (result.success) {
            alert("Cuenta creada. Ahora puedes iniciar sesión.");
            navigate('/login');
        } else {
            alert(result.error || "Error en el registro. Revisa los datos.");
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
            <Card className="w-full max-w-lg bg-slate-900/80 border-slate-800 p-10 rounded-[2.5rem] backdrop-blur-xl shadow-2xl">
                <div className="text-center mb-8">
                    <div className="inline-flex p-4 bg-cyan-600 rounded-2xl mb-4 shadow-lg shadow-cyan-900/40">
                        <GraduationCap className="text-white w-8 h-8" />
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">Crear Cuenta</h1>
                    <p className="text-slate-400 mt-2 font-medium">Únete a la academia Focus Studio</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <Input 
                                placeholder="Nombre" 
                                value={formData.nombre}
                                onChange={e => setFormData({...formData, nombre: e.target.value})}
                                className="bg-slate-800/50 border-slate-700 h-12 rounded-xl text-white"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <Input 
                                placeholder="Apellido" 
                                value={formData.apellido}
                                onChange={e => setFormData({...formData, apellido: e.target.value})}
                                className="bg-slate-800/50 border-slate-700 h-12 rounded-xl text-white"
                                required
                            />
                        </div>
                    </div>

                    <Input 
                        placeholder="Email Universitario" 
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 h-12 rounded-xl text-white"
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input 
                            placeholder="Legajo" 
                            value={formData.legajo}
                            onChange={e => setFormData({...formData, legajo: e.target.value})}
                            className="bg-slate-800/50 border-slate-700 h-12 rounded-xl text-white font-mono"
                            required
                        />
                        <select 
                            className="bg-slate-800/50 border-slate-700 h-12 rounded-xl text-white px-3 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                            value={formData.carrera_id}
                            onChange={e => setFormData({...formData, carrera_id: e.target.value})}
                            required
                        >
                            <option value="">Seleccionar Carrera</option>
                            {carreras.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                    </div>

                    <Input 
                        placeholder="Contraseña Segura" 
                        type="password"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        className="bg-slate-800/50 border-slate-700 h-12 rounded-xl text-white"
                        required
                    />

                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 h-14 rounded-2xl font-black text-lg shadow-xl shadow-cyan-900/20 transition-all active:scale-95">
                        REGISTRARSE
                    </Button>
                </form>

                <p className="text-slate-500 text-sm mt-8 text-center font-medium">
                    ¿Ya tienes cuenta? <Link to="/login" className="text-cyan-400 font-bold hover:underline">Inicia sesión aquí</Link>
                </p>
            </Card>
        </div>
    );
}