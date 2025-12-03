import axios from 'axios'

const API_URL = '/api'

const materiaService = {
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/materias`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/materias/${id}`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getGraph: async () => {
    try {
      const response = await axios.get(`${API_URL}/materias/grafo`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getClases: async (materiaId) => {
    try {
      const response = await axios.get(`${API_URL}/materias/${materiaId}/clases`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  createNotaClase: async (claseId, texto) => {
    try {
      const response = await axios.post(`${API_URL}/clases/${claseId}/nota`, { texto })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

export default materiaService