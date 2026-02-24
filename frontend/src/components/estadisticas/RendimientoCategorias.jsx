import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function RendimientoCategorias({ materias = [], notas = [], inscripciones = [] }) {
    const data = React.useMemo(() => {
        const stats = { 
            basica: { s: 0, c: 0 }, 
            especialidad: { s: 0, c: 0 }, 
            anual: { s: 0, c: 0 }, 
            cuat: { s: 0, c: 0 } 
        };
        
        // 1. Filtramos solo notas finales aprobadas o reales (excluyendo las de planificación -1)
        const notasValidas = notas.filter(n => n.es_final && n.nota >= 0);

        notasValidas.forEach(n => {
            const insc = inscripciones.find(i => i.id === n.inscripcion_id);
            if (!insc) return;

            // 2. Buscamos la materia por ID (UUID string)
            const m = materias.find(mat => String(mat.id) === String(insc.materia_id));
            if (!m) return;

            const nombre = (m.nombre || "").toLowerCase();
            const nivel = parseInt(m.nivel) || 0;
            const modalidad = (m.modalidad || "").toUpperCase();

            // 3. Lógica de Modalidad (Detección de "A", "Anual" o "1°/2° Cuat")
            const esAnual = modalidad === 'A' || modalidad.includes('ANUAL');
            const keyMod = esAnual ? 'anual' : 'cuat';

            // 4. Lógica de Especialidad (Nivel 3+ o palabras clave de Sistemas)
            const esEspecialidad = nivel >= 3 || 
                                 m.es_electiva === true || 
                                 nombre.includes('sistemas') || 
                                 nombre.includes('programación') || 
                                 nombre.includes('diseño');
            
            const keyDepto = esEspecialidad ? 'especialidad' : 'basica';

            // Acumulamos sumas (s) y contadores (c)
            stats[keyDepto].s += n.nota; 
            stats[keyDepto].c++;
            
            stats[keyMod].s += n.nota; 
            stats[keyMod].c++;
        });

        // 5. Formateamos para el gráfico
        return [
            { 
                name: 'Básicas', 
                promedio: stats.basica.c ? parseFloat((stats.basica.s / stats.basica.c).toFixed(2)) : 0, 
                color: '#6366f1' 
            },
            { 
                name: 'Especialidad', 
                promedio: stats.especialidad.c ? parseFloat((stats.especialidad.s / stats.especialidad.c).toFixed(2)) : 0, 
                color: '#8b5cf6' 
            },
            { 
                name: 'Anuales', 
                promedio: stats.anual.c ? parseFloat((stats.anual.s / stats.anual.c).toFixed(2)) : 0, 
                color: '#ec4899' 
            },
            { 
                name: 'Cuatrimestrales', 
                promedio: stats.cuat.c ? parseFloat((stats.cuat.s / stats.cuat.c).toFixed(2)) : 0, 
                color: '#f43f5e' 
            }
        ];
    }, [materias, notas, inscripciones]);

    return (
        <div className="h-[250px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                    data={data} 
                    layout="vertical" 
                    margin={{ left: 5, right: 35, top: 5, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                    <XAxis type="number" domain={[0, 10]} hide />
                    <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#64748b" 
                        fontSize={10} 
                        width={95} 
                        tickLine={false}
                        axisLine={false}
                        className="font-bold uppercase tracking-tighter"
                    />
                    
                    <Tooltip 
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                        contentStyle={{ 
                            backgroundColor: '#0f172a', 
                            border: '1px solid #334155',
                            borderRadius: '12px',
                        }}
                        itemStyle={{
                            color: '#22d3ee',
                            fontSize: '12px',
                            fontWeight: 'black'
                        }}
                        formatter={(value) => [`${value} promedio`, 'Puntaje']}
                    />
                    
                    <Bar dataKey="promedio" radius={[0, 6, 6, 0]} barSize={16}>
                        {data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}