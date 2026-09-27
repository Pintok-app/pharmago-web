import axios from 'axios'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pg_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  (err: unknown) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      const hadToken = !!localStorage.getItem('pg_token')
      ;['pg_token', 'pg_role', 'pg_user'].forEach((k) => localStorage.removeItem(k))
      // Only hard-redirect when a valid session expired, not during login itself
      if (hadToken) window.location.href = '/login'
    }
    return Promise.reject(err)
  },
)
