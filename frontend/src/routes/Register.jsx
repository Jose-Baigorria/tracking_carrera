import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { FaUser, FaLock, FaEnvelope, FaIdCard, FaUserTag } from 'react-icons/fa'

const Register = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    legajo: '',
    contrasena: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (formData.contrasena !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    setLoading(true)
    
    const { confirmPassword, ...registerData } = formData
    
    const result = await register(registerData)
    
    if (result.success) {
      navigate('/login')
    } else {
      setError(result.message)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Crear nueva cuenta
        </h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          Únete a StudyTracker y comienza tu aventura académica
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card py-8 px-4 sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="nombre" className="block text-sm font-medium text-text-primary mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-text-secondary" />
                  </div>
                  <input
                    id="nombre"
                    name="nombre"
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={handleChange}
                    className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="apellido" className="block text-sm font-medium text-text-primary mb-2">
                  Apellido
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUserTag className="text-text-secondary" />
                  </div>
                  <input
                    id="apellido"
                    name="apellido"
                    type="text"
                    required
                    value={formData.apellido}
                    onChange={handleChange}
                    className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="correo" className="block text-sm font-medium text-text-primary mb-2">
                Correo electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="text-text-secondary" />
                </div>
                <input
                  id="correo"
                  name="correo"
                  type="email"
                  required
                  value={formData.correo}
                  onChange={handleChange}
                  className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="legajo" className="block text-sm font-medium text-text-primary mb-2">
                Legajo (opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaIdCard className="text-text-secondary" />
                </div>
                <input
                  id="legajo"
                  name="legajo"
                  type="text"
                  value={formData.legajo}
                  onChange={handleChange}
                  className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="contrasena" className="block text-sm font-medium text-text-primary mb-2">
                  Contraseña
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-text-secondary" />
                  </div>
                  <input
                    id="contrasena"
                    name="contrasena"
                    type="password"
                    required
                    value={formData.contrasena}
                    onChange={handleChange}
                    className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                  Confirmar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-text-secondary" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 w-full bg-surface-light border-border focus:border-primary-500 focus:ring-primary-500"
                  />
                </div>
              </div>
            </div>

            <div className="text-sm">
              <Link to="/login" className="text-primary-400 hover:text-primary-300">
                ¿Ya tienes cuenta? Inicia sesión
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register