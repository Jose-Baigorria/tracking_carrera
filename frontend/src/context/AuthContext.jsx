import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      setUser(JSON.parse(userData))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
    
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    try {
      const response = await axios.post('/api/auth/login', {
        correo: email,
        contrasena: password
      })
      
      const { token, usuario } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(usuario))
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(usuario)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error de conexión' 
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await axios.post('/api/auth/registro', userData)
      return { success: true, data: response.data }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.error || 'Error de conexión' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete axios.defaults.headers.common['Authorization']
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}