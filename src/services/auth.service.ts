import { api } from '../lib/api'
import { saveAuth, clearAuth, type AuthUser, type Role } from '../store/authStore'

interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export const authService = {
  async login(login: string, password: string): Promise<Role> {
    const pharmacist = await api
      .post<LoginResponse>('/auth/pharmacist-login', { login, password })
      .catch(() => null)

    if (pharmacist) {
      saveAuth(pharmacist.data.accessToken, 'pharmacist', pharmacist.data.user, pharmacist.data.refreshToken)
      return 'pharmacist'
    }

    const admin = await api.post<LoginResponse>('/auth/admin-login', { login, password })
    saveAuth(admin.data.accessToken, 'admin', admin.data.user, admin.data.refreshToken)
    return 'admin'
  },

  logout() {
    clearAuth()
  },
}
