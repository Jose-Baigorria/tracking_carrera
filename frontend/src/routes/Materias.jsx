import { useState, useEffect } from 'react'
import MateriaCard from '../components/MateriaCard'
import { FaFilter, FaSearch, FaSort } from 'react-icons/fa'
import materiaService from '../api/services/materiaService'

const Materias = () => {
  const [materias, setMaterias] = useState([])
  const [filteredMaterias, setFilteredMaterias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    dificultad: 'all',
    semestre: 'all',
    tipo: 'all'
  })

  useEffect(() => {
    loadMaterias()
  }, [])

  useEffect(() => {
    filterMaterias()
  }, [search, filters, materias])

  const loadMaterias = async () => {
    try {
      const data = await materiaService.getAll()
      setMaterias(data)
      setFilteredMaterias(data)
    } catch (error) {
      console.error('Error cargando materias:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterMaterias = () => {
    let filtered = materias

    if (search) {
      filtered = filtered.filter(m =>
        m.nombre.toLowerCase().includes(search.toLowerCase()) ||
        m.codigo.toLowerCase().includes(search.toLowerCase())
      )
    }

    if (filters.dificultad !== 'all') {
      filtered = filtered.filter(m => m.dificultad === parseInt(filters.dificultad))
    }

    if (filters.semestre !== 'all') {
      filtered = filtered.filter(m => m.semestre === parseInt(filters.semestre))
    }

    if (filters.tipo !== 'all') {
      filtered = filtered.filter(m => 
        filters.tipo === 'electiva' ? m.es_electiva : !m.es_electiva
      )
    }

    setFilteredMaterias(filtered)
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Materias</h1>
        <p className="text-text-secondary">
          Explora todas las materias disponibles y sus correlativas
        </p>
      </div>

      {/* Filtros y búsqueda */}
      <div className="card p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-text-secondary" />
              </div>
              <input
                type="text"
                placeholder="Buscar materias por nombre o código..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <select
              value={filters.dificultad}
              onChange={(e) => handleFilterChange('dificultad', e.target.value)}
              className="bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">Toda dificultad</option>
              <option value="1">⭐ Fácil</option>
              <option value="2">⭐⭐ Medio</option>
              <option value="3">⭐⭐⭐ Difícil</option>
              <option value="4">⭐⭐⭐⭐ Muy difícil</option>
              <option value="5">⭐⭐⭐⭐⭐ Experto</option>
            </select>

            <select
              value={filters.semestre}
              onChange={(e) => handleFilterChange('semestre', e.target.value)}
              className="bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="all">Todos los semestres</option>
              <option value="1">1er Semestre</option>
              <option value="2">2do Semestre</option>
              <option value="3">3er Semestre</option>
              <option value="4">4to Semestre</option>
            </select>

            <button className="p-2 hover:bg-surface-light rounded-md transition-colors">
              <FaFilter className="text-text-secondary" />
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-4">
          <p className="text-text-secondary text-sm">Total Materias</p>
          <p className="text-2xl font-bold text-white">{materias.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-sm">Créditos Totales</p>
          <p className="text-2xl font-bold text-white">
            {materias.reduce((sum, m) => sum + (m.creditos || 0), 0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-sm">XP Total Disponible</p>
          <p className="text-2xl font-bold text-yellow-500">
            {materias.reduce((sum, m) => sum + (m.recompensa_xp || 0), 0)}
          </p>
        </div>
        <div className="card p-4">
          <p className="text-text-secondary text-sm">Monedas Total</p>
          <p className="text-2xl font-bold text-yellow-400">
            {materias.reduce((sum, m) => sum + (m.recompensa_monedas || 0), 0)}
          </p>
        </div>
      </div>

      {/* Lista de materias */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-surface-light rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-surface-light rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-surface-light rounded w-full mb-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-8 bg-surface-light rounded"></div>
                <div className="h-8 bg-surface-light rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredMaterias.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <p className="text-text-secondary">
              Mostrando {filteredMaterias.length} de {materias.length} materias
            </p>
            <button className="flex items-center space-x-2 text-text-secondary hover:text-white transition-colors">
              <FaSort />
              <span>Ordenar</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterias.map(materia => (
              <MateriaCard key={materia.id} materia={materia} />
            ))}
          </div>
        </>
      ) : (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-surface-light rounded-full flex items-center justify-center">
            <FaSearch className="text-2xl text-text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No se encontraron materias</h3>
          <p className="text-text-secondary">
            Intenta con otros términos de búsqueda o filtros
          </p>
        </div>
      )}
    </div>
  )
}

export default Materias