import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaGraduationCap, FaStar, FaCoins, FaChartLine, FaBook, FaUserFriends } from 'react-icons/fa'
import StatCard from '../components/StatCard'
import MateriaCard from '../components/MateriaCard'
import materiaService from '../api/services/materiaService'

const Dashboard = () => {
  const { user } = useAuth()
  const [materias, setMaterias] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaterias()
  }, [])

  const loadMaterias = async () => {
    try {
      const data = await materiaService.getAll()
      setMaterias(data.slice(0, 4)) // Mostrar solo 4 materias
    } catch (error) {
      console.error('Error cargando materias:', error)
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { title: 'Nivel Actual', value: user?.nivel || 1, change: 12, icon: FaChartLine, color: 'blue' },
    { title: 'Experiencia Total', value: user?.experiencia || 0, change: 8, icon: FaStar, color: 'yellow' },
    { title: 'Monedas', value: user?.monedas || 0, change: -2, icon: FaCoins, color: 'orange' },
    { title: 'Materias Activas', value: '3', change: 5, icon: FaBook, color: 'purple' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          ¡Bienvenido, {user?.nombre || 'Estudiante'}!
        </h1>
        <p className="text-text-secondary">
          Tu progreso académico en una experiencia gamificada
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="card p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">Progreso del nivel</h3>
          <span className="text-sm text-text-secondary">
            {user?.experiencia || 0} / 1000 XP
          </span>
        </div>
        <div className="w-full bg-surface-light rounded-full h-2.5">
          <div 
            className="bg-gradient-to-r from-primary-600 to-primary-400 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${((user?.experiencia || 0) / 1000) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Materias destacadas */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Materias Destacadas</h2>
          <Link 
            to="/materias" 
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            Ver todas →
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => (
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
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {materias.map(materia => (
              <MateriaCard key={materia.id} materia={materia} />
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg">
              <FaBook className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Clases Pendientes</h3>
              <p className="text-sm text-text-secondary">3 clases por completar</p>
            </div>
          </div>
          <Link 
            to="/materias" 
            className="block w-full py-2 text-center bg-surface-light hover:bg-surface-lighter rounded-md transition-colors"
          >
            Ver clases
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
              <FaUserFriends className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Personajes</h3>
              <p className="text-sm text-text-secondary">2 personajes desbloqueados</p>
            </div>
          </div>
          <Link 
            to="/personajes" 
            className="block w-full py-2 text-center bg-surface-light hover:bg-surface-lighter rounded-md transition-colors"
          >
            Ver personajes
          </Link>
        </div>

        <div className="card p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <FaGraduationCap className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white">Próximo Examen</h3>
              <p className="text-sm text-text-secondary">Analisis I - 15/04</p>
            </div>
          </div>
          <Link 
            to="/materias" 
            className="block w-full py-2 text-center bg-surface-light hover:bg-surface-lighter rounded-md transition-colors"
          >
            Estudiar
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard