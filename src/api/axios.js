import axios from 'axios'

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && envUrl.includes('localhost')) {
    return envUrl.replace('localhost', window.location.hostname)
  }
  return envUrl
}

const api = axios.create({ baseURL: getBaseURL() })
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

export default api
