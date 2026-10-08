import axios from 'axios'

const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'
  if (
    typeof window !== 'undefined' &&
    window.location.hostname &&
    window.location.hostname !== 'localhost' &&
    envUrl.includes('localhost')
  ) {
    return envUrl.replace('localhost', window.location.hostname)
  }
  return envUrl
}

// Create Axios instance with withCredentials enabled so HttpOnly cookies are automatically sent
const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true,
})

// Attach current access token to Authorization header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Queue state for silent refresh of multiple concurrent requests
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    const originalRequest = err.config

    // If there is no response (e.g. network failure) or request was cancelled
    if (!err.response || !originalRequest) {
      return Promise.reject(err)
    }

    // SAFEGUARD B: Never intercept /api/auth/refresh itself if it returns 401!
    // Prevents infinite refresh loops: refresh -> 401 -> refresh -> 401...
    if (originalRequest.url?.includes('/api/auth/refresh')) {
      processQueue(err, null)
      localStorage.removeItem('token')
      return Promise.reject(err)
    }

    // Check if error is 401 with code 'TOKEN_EXPIRED'
    const isTokenExpired =
      err.response.status === 401 &&
      err.response.data?.code === 'TOKEN_EXPIRED'

    if (isTokenExpired && !originalRequest._retry) {
      // SAFEGUARD A: Mark request as retried so it can only be retried once
      originalRequest._retry = true

      // If a refresh is already in-flight, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
            return api(originalRequest)
          })
          .catch((queueErr) => {
            return Promise.reject(queueErr)
          })
      }

      isRefreshing = true

      try {
        // Send refresh request. The HttpOnly cookie 'refreshToken' is automatically sent by the browser.
        const refreshResponse = await api.post('/api/auth/refresh')
        const newAccessToken =
          refreshResponse.data?.accessToken || refreshResponse.data?.token

        if (!newAccessToken) {
          throw new Error('No access token returned from refresh endpoint')
        }

        // Store updated access token in localStorage
        localStorage.setItem('token', newAccessToken)

        // Update default header on axios instance
        api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`

        // Resolve all queued requests with the new token
        processQueue(null, newAccessToken)

        // Retry the original request with the fresh token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        return api(originalRequest)
      } catch (refreshErr) {
        // SAFEGUARD C: Handle refresh failure cleanly
        processQueue(refreshErr, null)
        localStorage.removeItem('token')

        // Redirect to login if user is not already on login page
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
          window.location.href = '/login'
        }

        return Promise.reject(refreshErr)
      } finally {
        isRefreshing = false
      }
    }

    // For any other 401 (e.g. invalid password, no token provided)
    if (
      err.response.status === 401 &&
      !originalRequest.url?.includes('/api/auth/login') &&
      !originalRequest.url?.includes('/api/auth/register')
    ) {
      // If access token was revoked or malformed, clear and redirect
      if (err.response.data?.message?.includes('Token invalid')) {
        localStorage.removeItem('token')
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login')
        ) {
          window.location.href = '/login'
        }
      }
    }

    return Promise.reject(err)
  }
)

export default api
