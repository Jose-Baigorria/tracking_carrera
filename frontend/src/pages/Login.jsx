import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useNavigate, Link } from "react-router-dom";
import { apiClient } from '@/api/apiClient';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Llamamos ÚNICAMENTE a la función del contexto
        const result = await login(email, password);
        
        if (result.success) {
            navigate('/');
        } else {
            alert(result.error || "Credenciales incorrectas");
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-slate-900 border-slate-800 p-8 rounded-[2rem]">
                <h1 className="text-3xl font-black text-white mb-6">Iniciar Sesión</h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input 
                        placeholder="Email" 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-slate-800 border-slate-700 h-12 rounded-xl text-white"
                    />
                    <Input 
                        placeholder="Contraseña" 
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="bg-slate-800 border-slate-700 h-12 rounded-xl text-white"
                    />
                    <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 h-12 rounded-xl font-bold">
                        INGRESAR
                    </Button>
                </form>
                <p className="text-slate-500 text-sm mt-6 text-center">
                    ¿No tienes cuenta? <Link to="/register" className="text-cyan-400 font-bold">Regístrate</Link>
                </p>
            </Card>
        </div>
    );
}