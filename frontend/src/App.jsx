import { useEffect, useState } from "react"
import "./styles/global.css"

function App() {
  const [backendStatus, setBackendStatus] = useState("Probando conexión...")

  useEffect(() => {
    fetch("/api/health")
      .then(res => res.json())
      .then(data => setBackendStatus(`✅ ${data.message}`))
      .catch(() => setBackendStatus("❌ No se pudo conectar al backend"))
  }, [])

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🎮 Study Tracker Game</h1>
      <p>Estado backend: {backendStatus}</p>
      <p>Frontend funcionando en puerto 3000</p>
      <a href="http://localhost:5000/api/health" target="_blank">
        Verificar backend
      </a>
    </div>
  )
}

export default App
