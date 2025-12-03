import axios from 'axios'

const API_URL = '/api'

const personajeService = {
  getAll: async () => {
    try {
      const response = await axios.get(`${API_URL}/personajes`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

export default personajeService