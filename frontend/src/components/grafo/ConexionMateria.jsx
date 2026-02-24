import React from 'react';

export default function ConexionMateria({ desde, hacia, tipo = 'regular' }) {
    const color = tipo === 'aprobada' ? '#ef4444' : '#64748b';
    const dashArray = tipo === 'aprobada' ? '5,5' : '0';
    
    return (
        <line
            x1={desde.x}
            y1={desde.y}
            x2={hacia.x}
            y2={hacia.y}
            stroke={color}
            strokeWidth="2"
            strokeDasharray={dashArray}
            opacity="0.3"
            markerEnd="url(#arrowhead)"
        />
    );
}