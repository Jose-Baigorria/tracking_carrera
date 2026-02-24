import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { EstudioProvider } from "./context/EstudioContext";
import { AuthProvider } from "./context/AuthContext"; //
import { ProtectedRoute } from "./components/auth/ProtectedRoute" 
import FloatingTimer from "./components/estudio/FloatingTimer"; // <--- IMPORTAR EL COMPONENTE
import Dashboard from "./pages/Dashboard";
import GrafoMaterias from "./pages/GrafoMaterias";
import Coleccion from "./pages/Coleccion";
import Estadisticas from "./pages/Estadisticas";
import Estudio from "./pages/Estudio";
import DetalleMateria from "./pages/DetalleMateria";
import Logros from "./pages/Logros";
import Calendario from "./pages/Calendario";
import Inscripcion from "./pages/Inscripcion";
import Plan from "./pages/Plan";
import Materias from "./pages/Materias";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Comunidad from "./pages/Comunidad";
import ChatGrupo from "./pages/ChatGrupo";
import MuroApuntes from "./pages/MuroApuntes";
import PerfilUsuario from "./pages/PerfilUsuario";
import ChatPrivado from "./pages/ChatPrivado";


const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EstudioProvider> 
          <BrowserRouter>
            {/* Colocamos el FloatingTimer aquí para que esté presente en todas las rutas.
                Como está dentro del EstudioProvider, tiene acceso al tiempo real.
            */}
            <FloatingTimer /> 

            <Routes>
              {/* Rutas Públicas */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Rutas Privadas */}
              <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/grafo" element={<GrafoMaterias />} />
              <Route path="/coleccion" element={<Coleccion />} />
              <Route path="/estadisticas" element={<Estadisticas />} />
              <Route path="/estudio" element={<Estudio />} />
              <Route path="/detalle" element={<DetalleMateria />} />
              <Route path="/logros" element={<Logros />} />
              <Route path="/inscripcion" element={<Inscripcion />} />
              <Route path="/plan" element={<Plan />} />
              <Route path="/materias" element={<Materias />} />
              <Route path="/comunidad" element={<Comunidad />} />
              <Route path="/comunidad/muro" element={<MuroApuntes />} />
              <Route path="/comunidad/group/:id" element={<ChatGrupo />} />
              <Route path="/comunidad/perfil/:id" element={<PerfilUsuario />} />
              <Route path="/comunidad/chat/privado/:id" element={<ChatPrivado />} />
            </Routes>
          </BrowserRouter>
        </EstudioProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;