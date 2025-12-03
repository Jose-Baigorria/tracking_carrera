import axios from 'axios'

const API_URL = '/api'

const authService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        correo: email,
        contrasena: password
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  register: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/auth/registro`, userData)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  },

  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/perfil`)
      return response.data
    } catch (error) {
      throw error.response?.data || error
    }
  }
}

export default authService