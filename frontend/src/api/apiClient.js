import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
});

// Interceptor para añadir el token a todas las peticiones
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor para manejar respuestas de error (ej: token expirado)
api.interceptors.response.use(
    (response) => response,
    (error) => {
         if (error.response?.status === 401 &&
        !error.config.url.includes('/auth/login')) {
            // Token inválido o expirado
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Opcional: redirigir a login
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

// Funciones auxiliares para auth
export const authHelper = {
    setToken: (token) => {
        localStorage.setItem('token', token);
        // Re-aplicar headers
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    getToken: () => localStorage.getItem('token'),
    removeToken: () => {
        localStorage.removeItem('token');
        delete api.defaults.headers.common['Authorization'];
    },
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    getUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
    }
};

export const apiClient = {
    // Auth endpoints
    auth: {
        login: (data) => api.post('/auth/login', data).then(res => {
            const token = res.data.access_token; // Ajustado a FastAPI
            if (token) {
                authHelper.setToken(token);
                if (res.data.user) authHelper.setUser(res.data.user);
            }
            return res.data;
        }),
        register: (data) => api.post('/auth/register', data).then(res => {
            const token = res.data.access_token; 
            if (token) {
                authHelper.setToken(token);
                if (res.data.user) authHelper.setUser(res.data.user);
            }
            return res.data;
        }),
        profile: () => api.get('/auth/profile').then(res => res.data),
        logout: () => {
            authHelper.logout();
            return Promise.resolve({ message: 'Logged out' });
        }
    },
    
    // Dashboard
    dashboard: {
        stats: () => api.get('/dashboard-stats').then(res => res.data),
    },
    
    // Materias
    materias: {
        list: (params) => api.get('/materias', { params }).then(res => res.data),
        get: (id) => api.get(`/materias/${id}`).then(res => res.data),
        //listCorrelativas: (params) => api.get('/materias/correlatividades', { params }).then(res => res.data),
        listCorrelativas: () => api.get('/materias/correlatividades').then(res => res.data),
        listCarreras: () => api.get('/carreras').then(res => res.data),
    },
    
    // Inscripciones
    inscripciones: {
        list: (params) => api.get('/inscripciones', { params }).then(res => res.data),
        get: (id) => api.get(`/inscripciones/${id}`).then(res => res.data),
        update: (id, data) => api.patch(`/inscripciones/${id}`, data).then(res => res.data),
        create: (data) => api.post('/inscripciones', data).then(res => res.data),
        delete: (id) => api.delete(`/inscripciones/${id}`).then(res => res.data),
    },
    
    // Clases
    clases: {
        list: (params) => api.get('/clases', { params }).then(res => res.data),
        create: (data) => api.post('/clases', data).then(res => res.data),
        update: (id, data) => api.patch(`/clases/${id}`, data).then(res => res.data),
        delete: (id) => api.delete(`/clases/${id}`).then(res => res.data),
    },
    
    // Notas
    notas: {
        list: (params) => api.get('/notas', { params }).then(res => res.data),
        create: (data) => api.post('/notas', data).then(res => res.data),
        update: (id, data) => api.patch(`/notas/${id}`, data).then(res => res.data),
        delete: (id) => api.delete(`/notas/${id}`).then(res => res.data),
    },
    
    // Profesores
    profesores: {
        list: (params) => api.get('/profesores/coleccion', { params }).then(res => res.data),
    },
    
    // Flashcards
    flashcards: {
        list: (params) => api.get('/flashcards', { params }).then(res => res.data),
        create: (data) => api.post('/flashcards', data).then(res => res.data),
        update: (id, data) => api.patch(`/flashcards/${id}`, data).then(res => res.data),
    },
    
    // Sesiones de estudio
    sesiones: {
        list: (params) => api.get('/sesiones', { params }).then(res => res.data),
        create: (data) => api.post('/sesiones', data).then(res => res.data),
    },
    
    // Calendario
    calendario: {
        eventos: (params) => api.get('/calendario/eventos', { params }).then(res => res.data),
        importarPDF: (formData) => api.post('/calendario/importar-pdf', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }).then(res => res.data),
    },
    
    // Planificación
    planificacion: {
        list: (params) => api.get('/planificacion/eventos', { params }).then(res => res.data),
        create: (data) => api.post('/planificacion/eventos', data).then(res => res.data),
        update: (id, data) => api.patch(`/planificacion/eventos/${id}`, data).then(res => res.data),
        delete: (id) => api.delete(`/planificacion/eventos/${id}`).then(res => res.data),
    },
    
    // Logros
    logros: {
        list: (params) => api.get('/logros', { params }).then(res => res.data),
        get: (id) => api.get(`/logros/${id}`).then(res => res.data),
        categorias: () => api.get('/categorias-logros').then(res => res.data),
    },
    //Social
    social: {
        // Grupos de Estudio
        grupos: {
            list: (params) => api.get('/social/grupos', { params }).then(res => res.data),
            get: (id) => api.get(`/social/grupos/${id}`).then(res => res.data),
            create: (data) => api.post('/social/grupos', data).then(res => res.data),
            unirse: (id, codigo) => api.post(`/social/grupos/${id}/unirse`, { codigo_invitacion: codigo }).then(res => res.data),
            sesiones: {
                crear: (grupoId, data) => api.post(`/social/grupos/${grupoId}/sesiones`, data).then(res => res.data),
            }
        },
        
        // Muro de Apuntes Compartidos
        apuntes: {
            list: (params) => api.get('/social/apuntes', { params }).then(res => res.data),
            create: (data) => {
                // Si la data es FormData (para archivos), Axios ajusta el Content-Type solo
                const isFormData = data instanceof FormData;
                return api.post('/social/apuntes', data, {
                    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
                }).then(res => res.data);
            },
            calificar: (apunteId, data) => api.post(`/social/apuntes/${apunteId}/calificar`, data).then(res => res.data),
        },
        
        // Búsqueda de Usuarios (Materia, Legajo, Email, Nombre)
        usuarios: {
            buscar: (params) => api.get('/social/usuarios/buscar', { params }).then(res => res.data),
            perfil: (id) => api.get(`/social/usuarios/${id}/perfil`).then(res => res.data),
        },

        // Mensajería en tiempo real (Chat de Grupo)
        mensajes: {
            list: (grupoId) => api.get(`/social/grupos/${grupoId}/mensajes`).then(res => res.data),
            send: (grupoId, data) => api.post(`/social/grupos/${grupoId}/mensajes`, data).then(res => res.data),
        },
        
        // Estadísticas Globales del Hub
        estadisticas: () => api.get('/social/estadisticas/comunidad').then(res => res.data),
        
        // Tendencias (Generado por el Engine de Python)
        tendencias: () => api.get('/social/tendencias').then(res => res.data),
    },
    
    // Configuración
    config: {
        get: () => api.get('/configuracion').then(res => res.data),
        update: (data) => api.put('/configuracion', data).then(res => res.data),
    }
};

export default api;