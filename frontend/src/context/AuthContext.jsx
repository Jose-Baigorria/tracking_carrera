// contexts/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { apiClient, authHelper } from "../api/apiClient";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Verificar si hay usuario guardado al cargar
        const token = authHelper.getToken();
        const savedUser = authHelper.getUser();
        
        if (token && savedUser) {
            setUser(savedUser);
            // Opcional: validar token con backend
            // apiClient.auth.profile().then(user => {
            //     setUser(user);
            // }).catch(() => {
            //     authHelper.logout();
            //     setUser(null);
            // });
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
        try {
            const response = await apiClient.auth.login({ email, password });
            setUser(response.user);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Error de autenticación' };
        }
    };

    const register = async (userData) => {
        try {
            const response = await apiClient.auth.register(userData);
            setUser(response.user);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.response?.data?.detail || 'Error en el registro' };
        }
    };

    const logout = () => {
        apiClient.auth.logout();
        setUser(null);
    };

    const value = {
        user,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        loading
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};