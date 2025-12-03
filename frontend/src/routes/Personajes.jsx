import { useState, useEffect } from 'react'
import { FaStar, FaLock, FaUnlock, FaCrown, FaUser } from 'react-icons/fa'
import personajeService from '../api/services/personajeService'

const Personajes = () => {
  const [personajes, setPersonajes] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState('all')

  useEffect(() => {
    loadPersonajes()
  }, [])

  const loadPersonajes = async () => {
    try {
      const data = await personajeService.getAll()
      setPersonajes(data)
    } catch (error) {
      console.error('Error cargando personajes:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRarityColor = (rareza) => {
    const colors = {
      comun: 'bg-gray-500',
      raro: 'bg-blue-500',
      epico: 'bg-purple-500',
      legendario: 'bg-yellow-500'
    }
    return colors[rareza] || 'bg-gray-500'
  }

  const getRarityLabel = (rareza) => {
    const labels = {
      comun: 'Común',
      raro: 'Raro',
      epico: 'Épico',
      legendario: 'Legendario'
    }
    return labels[rareza] || 'Común'
  }

  const filteredPersonajes = selectedType === 'all' 
    ? personajes 
    : personajes.filter(p => p.tipo === selectedType)

  const personajeTypes = [
    { id: 'all', label: 'Todos' },
    { id: 'profesor', label: 'Profesores' },
    { id: 'jefe_catedra', label: 'Jefes de Cátedra' },
    { id: 'ayudante', label: 'Ayudantes' }
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Personajes</h1>
        <p className="text-text-secondary">
          Desbloquea personajes especiales completando logros académicos
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 mb-8">
        {personajeTypes.map(type => (
          <button
            key={type.id}
            onClick={() => setSelectedType(type.id)}
            className={`px-4 py-2 rounded-md transition-colors ${
              selectedType === type.id
                ? 'bg-primary-600 text-white'
                : 'bg-surface-light text-text-secondary hover:bg-surface-lighter'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      {/* Contador */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary">Total Personajes</p>
              <p className="text-2xl font-bold text-white">{personajes.length}</p>
            </div>
            <FaUser className="text-2xl text-text-secondary" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary">Desbloqueados</p>
              <p className="text-2xl font-bold text-green-500">2</p>
            </div>
            <FaUnlock className="text-2xl text-green-500" />
          </div>
        </div>
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-text-secondary">Por Desbloquear</p>
              <p className="text-2xl font-bold text-yellow-500">{personajes.length - 2}</p>
            </div>
            <FaLock className="text-2xl text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Lista de personajes */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-48 bg-surface-light rounded-lg mb-4"></div>
              <div className="h-4 bg-surface-light rounded w-1/3 mb-2"></div>
              <div className="h-6 bg-surface-light rounded w-2/3 mb-4"></div>
              <div className="h-4 bg-surface-light rounded w-full mb-2"></div>
              <div className="h-4 bg-surface-light rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : filteredPersonajes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPersonajes.map(personaje => {
            const isUnlocked = personaje.id <= 2 // Simulación: primeros 2 desbloqueados
            
            return (
              <div key={personaje.id} className="card p-6 relative overflow-hidden">
                {/* Indicador de rareza */}
                <div className={`absolute top-0 right-0 ${getRarityColor(personaje.rareza)} text-white px-3 py-1 rounded-bl-lg`}>
                  <span className="text-xs font-bold">{getRarityLabel(personaje.rareza)}</span>
                </div>

                {/* Estado de desbloqueo */}
                <div className="absolute top-0 left-0 bg-background-dark px-3 py-1 rounded-br-lg">
                  {isUnlocked ? (
                    <div className="flex items-center space-x-1 text-green-500">
                      <FaUnlock className="text-xs" />
                      <span className="text-xs font-bold">DESBLOQUEADO</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1 text-text-secondary">
                      <FaLock className="text-xs" />
                      <span className="text-xs font-bold">BLOQUEADO</span>
                    </div>
                  )}
                </div>

                {/* Avatar del personaje */}
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                  {personaje.url_imagen ? (
                    <img 
                      src={personaje.url_imagem} 
                      alt={personaje.nombre}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <FaUser className="text-4xl text-white" />
                  )}
                </div>

                {/* Información del personaje */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-bold text-white mb-1">{personaje.nombre}</h3>
                  <p className="text-text-secondary mb-2">{personaje.titulo}</p>
                  <p className="text-sm text-text-secondary mb-4">{personaje.descripcion}</p>
                  
                  <div className="flex justify-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-xs">Int: {personaje.inteligencia}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs">Car: {personaje.carisma}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-xs">Con: {personaje.conocimiento}</span>
                    </div>
                  </div>
                </div>

                {/* Condición de desbloqueo */}
                <div className="border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="text-text-secondary mb-1">Para desbloquear:</p>
                      <p className="font-semibold text-white">
                        {personaje.tipo_condicion_desbloqueo === 'materia_aprobada' 
                          ? `Aprobar ${personaje.valor_condicion_desbloqueo}`
                          : 'Condición especial'}
                      </p>
                    </div>
                    {isUnlocked ? (
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <FaStar className="text-green-500" />
                      </div>
                    ) : (
                      <div className="p-2 bg-surface-light rounded-lg">
                        <FaLock className="text-text-secondary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-surface-light rounded-full flex items-center justify-center">
            <FaUser className="text-2xl text-text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No se encontraron personajes</h3>
          <p className="text-text-secondary">
            Intenta con otros filtros o completa más logros para desbloquear personajes
          </p>
        </div>
      )}

      {/* Leyenda de rareza */}
      <div className="mt-8 card p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Rarezas de Personajes</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3 p-3 bg-gray-500/20 rounded-lg">
            <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
            <div>
              <p className="font-semibold text-white">Común</p>
              <p className="text-xs text-text-secondary">Fácil de obtener</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-blue-500/20 rounded-lg">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <div>
              <p className="font-semibold text-white">Raro</p>
              <p className="text-xs text-text-secondary">Requiere logros específicos</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-purple-500/20 rounded-lg">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <div>
              <p className="font-semibold text-white">Épico</p>
              <p className="text-xs text-text-secondary">Logros avanzados</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 bg-yellow-500/20 rounded-lg">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div>
              <p className="font-semibold text-white">Legendario</p>
              <p className="text-xs text-text-secondary">Logros excepcionales</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Personajes