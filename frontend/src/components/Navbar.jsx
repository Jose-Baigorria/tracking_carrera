import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUser, FaGraduationCap, FaGamepad, FaSignOutAlt } from 'react-icons/fa'

const Navbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="fixed top-0 w-full bg-surface border-b border-border z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                <FaGraduationCap className="text-white" />
              </div>
              <span className="text-xl font-bold text-white">StudyTracker</span>
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link
                to="/"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-light hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/materias"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-light hover:text-white transition-colors"
              >
                Materias
              </Link>
              <Link
                to="/personajes"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-light hover:text-white transition-colors"
              >
                Personajes
              </Link>
              <Link
                to="/perfil"
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-surface-light hover:text-white transition-colors"
              >
                Perfil
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1 bg-surface-light rounded-lg">
              <FaUser className="text-text-secondary" />
              <span className="text-sm">{user?.nombre || 'Usuario'}</span>
              <span className="px-2 py-0.5 bg-primary-800 text-primary-200 text-xs rounded">
                Nvl {user?.nivel || 1}
              </span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-surface-light rounded-md transition-colors"
              title="Cerrar sesión"
            >
              <FaSignOutAlt className="text-text-secondary hover:text-white" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar