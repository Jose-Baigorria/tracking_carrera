import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FaUser, FaEnvelope, FaIdCard, FaStar, FaCoins, FaTrophy, FaCalendar } from 'react-icons/fa'
import authService from '../api/services/authService'

const Perfil = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      const data = await authService.getProfile()
      setProfile(data)
    } catch (error) {
      console.error('Error cargando perfil:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="card p-8 text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mi Perfil</h1>
        <p className="text-text-secondary">
          Tu progreso, logros y estadísticas académicas
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Información personal */}
        <div className="lg:col-span-2">
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">Información Personal</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-text-secondary">
                  <FaUser />
                  <span>Nombre</span>
                </label>
                <div className="p-3 bg-surface-light rounded-md">
                  {profile?.usuario?.nombre} {profile?.usuario?.apellido}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-text-secondary">
                  <FaEnvelope />
                  <span>Correo electrónico</span>
                </label>
                <div className="p-3 bg-surface-light rounded-md">
                  {profile?.usuario?.correo}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-text-secondary">
                  <FaIdCard />
                  <span>Legajo</span>
                </label>
                <div className="p-3 bg-surface-light rounded-md">
                  {profile?.usuario?.legajo || 'No especificado'}
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center space-x-2 text-text-secondary">
                  <FaCalendar />
                  <span>Nivel</span>
                </label>
                <div className="p-3 bg-surface-light rounded-md flex items-center space-x-2">
                  <div className="w-6 h-6 bg-gradient-to-br from-primary-600 to-primary-400 rounded flex items-center justify-center">
                    <span className="text-xs font-bold">{profile?.usuario?.nivel}</span>
                  </div>
                  <span>Nivel {profile?.usuario?.nivel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="card p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg">
                  <FaStar className="text-white" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Experiencia Total</p>
                  <p className="text-2xl font-bold text-white">{profile?.usuario?.experiencia || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg">
                  <FaCoins className="text-white" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Monedas</p>
                  <p className="text-2xl font-bold text-white">{profile?.usuario?.monedas || 0}</p>
                </div>
              </div>
            </div>

            <div className="card p-6">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg">
                  <FaTrophy className="text-white" />
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Insignias</p>
                  <p className="text-2xl font-bold text-white">{profile?.insignias?.length || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Personajes desbloqueados */}
        <div>
          <div className="card p-6 mb-6">
            <h2 className="text-xl font-semibold text-white mb-6">Personajes Desbloqueados</h2>
            
            {profile?.personajes_desbloqueados?.length > 0 ? (
              <div className="space-y-4">
                {profile.personajes_desbloqueados.slice(0, 3).map(personaje => (
                  <div key={personaje.id} className="flex items-center space-x-4 p-3 bg-surface-light rounded-md">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-xs font-bold">P</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{personaje.nombre}</p>
                      <p className="text-xs text-text-secondary">{personaje.titulo}</p>
                    </div>
                  </div>
                ))}
                
                {profile.personajes_desbloqueados.length > 3 && (
                  <p className="text-center text-text-secondary text-sm">
                    +{profile.personajes_desbloqueados.length - 3} más
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-light rounded-full flex items-center justify-center">
                  <FaUser className="text-2xl text-text-secondary" />
                </div>
                <p className="text-text-secondary">Aún no has desbloqueado personajes</p>
              </div>
            )}
          </div>

          {/* Insignias */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-white mb-6">Insignias Obtenidas</h2>
            
            {profile?.insignias?.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {profile.insignias.slice(0, 4).map(insignia => (
                  <div key={insignia.id} className="text-center">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                      <FaTrophy className="text-white" />
                    </div>
                    <p className="text-xs font-semibold text-white">{insignia.nombre}</p>
                    <p className="text-xs text-text-secondary">{insignia.puntos} pts</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-surface-light rounded-full flex items-center justify-center">
                  <FaTrophy className="text-2xl text-text-secondary" />
                </div>
                <p className="text-text-secondary">Aún no has obtenido insignias</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Perfil