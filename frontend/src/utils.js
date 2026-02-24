export const createPageUrl = (pageName) => {
    const map = {
        'Dashboard': '/',
        'GrafoMaterias': '/grafo',
        'Coleccion': '/coleccion',
        'Estadisticas': '/estadisticas',
        'Estudio': '/estudio',
        'DetalleMateria': '/detalle',
        'Logros': '/logros',
        'Calendario': '/calendario'
    };
    return map[pageName] || '/';
};