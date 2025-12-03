import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import Login from './routes/Login'
import Register from './routes/Register'
import Dashboard from './routes/Dashboard'
import Materias from './routes/Materias'
import Perfil from './routes/Perfil'
import Personajes from './routes/Personajes'
import './App.css'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary">Cargando aplicación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {user && <Navbar />}
      <div className={`${user ? 'pt-16' : ''}`}>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/materias" element={user ? <Materias /> : <Navigate to="/login" />} />
          <Route path="/perfil" element={user ? <Perfil /> : <Navigate to="/login" />} />
          <Route path="/personajes" element={user ? <Personajes /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? "/" : "/login"} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App