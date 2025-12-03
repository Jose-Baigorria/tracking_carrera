import { Link } from 'react-router-dom'
import { FaBook, FaStar, FaCoins, FaArrowRight } from 'react-icons/fa'

const MateriaCard = ({ materia }) => {
  const getDifficultyColor = (dificultad) => {
    const colors = {
      1: 'bg-green-500',
      2: 'bg-blue-500',
      3: 'bg-yellow-500',
      4: 'bg-orange-500',
      5: 'bg-red-500'
    }
    return colors[dificultad] || 'bg-gray-500'
  }

  return (
    <div className="card p-6 fade-in">
      <div className="flex justify-between items-start mb-4">
        <div>
          <span className="text-xs text-text-secondary font-mono bg-surface-dark px-2 py-1 rounded">
            {materia.codigo}
          </span>
          <h3 className="text-xl font-bold mt-2 text-white">{materia.nombre}</h3>
          <p className="text-text-secondary text-sm mt-1 line-clamp-2">
            {materia.descripcion || 'Sin descripción'}
          </p>
        </div>
        <div className={`w-3 h-3 rounded-full ${getDifficultyColor(materia.dificultad)}`} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <FaBook className="text-text-secondary" />
          <div>
            <p className="text-xs text-text-secondary">Créditos</p>
            <p className="font-semibold">{materia.creditos}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FaStar className="text-yellow-500" />
          <div>
            <p className="text-xs text-text-secondary">XP</p>
            <p className="font-semibold text-yellow-500">{materia.recompensa_xp}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <FaCoins className="text-yellow-400" />
          <div>
            <p className="text-xs text-text-secondary">Monedas</p>
            <p className="font-semibold text-yellow-400">{materia.recompensa_monedas}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-500" />
          <div>
            <p className="text-xs text-text-secondary">Semestre</p>
            <p className="font-semibold">{materia.semestre || 'N/A'}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-border">
        <div className="flex space-x-2">
          {materia.es_electiva && (
            <span className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
              Electiva
            </span>
          )}
          <span className="px-2 py-1 bg-surface-light text-text-secondary text-xs rounded">
            {materia.dificultad}/5
          </span>
        </div>
        <Link
          to={`/materias/${materia.id}`}
          className="flex items-center space-x-1 text-primary-400 hover:text-primary-300 transition-colors"
        >
          <span className="text-sm">Ver detalles</span>
          <FaArrowRight />
        </Link>
      </div>
    </div>
  )
}

export default MateriaCard