import axios from 'axios'
import { clearAuth, getAuth, saveAccessToken } from '../store/authStore'

export const API_URL = import.meta.env.VITE_API_URL ?? 'https://pharmago-api-production.up.railway.app'

export const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = getAuth().token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<(token: string) => void> = []

api.interceptors.response.use(
  (r) => r,
  async (err: unknown) => {
    if (!axios.isAxiosError(err) || err.response?.status !== 401) return Promise.reject(err)

    const { refreshToken } = getAuth()
    const isLoginRequest = err.config?.url?.includes('/auth/')

    // Auth endpoint failures (login/refresh attempts) — just reject, let the form handle it
    if (isLoginRequest) return Promise.reject(err)

    // No refresh token and not on a login page — clear session and redirect
    if (!refreshToken) {
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    // Queue up requests that arrive while we're already refreshing
    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push((token) => {
          err.config!.headers!.Authorization = `Bearer ${token}`
          resolve(api(err.config!))
        })
      })
    }

    isRefreshing = true
    try {
      const res = await axios.post(`${API_URL}/auth/refresh`, { refreshToken })
      const newToken: string = res.data.accessToken
      saveAccessToken(newToken)
      queue.forEach((cb) => cb(newToken))
      queue = []
      err.config!.headers!.Authorization = `Bearer ${newToken}`
      return api(err.config!)
    } catch {
      clearAuth()
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)
