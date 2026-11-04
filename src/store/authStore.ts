export type Role = 'pharmacist' | 'admin'

export interface AuthUser {
  id: string
  name: string
  pharmacyId?: string
}

interface AuthState {
  token: string | null
  refreshToken: string | null
  role: Role | null
  user: AuthUser | null
}

const K = { token: 'pg_token', refresh: 'pg_refresh', role: 'pg_role', user: 'pg_user' }

export function getAuth(): AuthState {
  const raw = localStorage.getItem(K.user)
  let user: AuthUser | null = null
  try {
    user = raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    user = null
  }
  return {
    token: localStorage.getItem(K.token),
    refreshToken: localStorage.getItem(K.refresh),
    role: localStorage.getItem(K.role) as Role | null,
    user,
  }
}

export function saveAuth(accessToken: string, role: Role, user: AuthUser, refreshToken?: string) {
  localStorage.setItem(K.token, accessToken)
  localStorage.setItem(K.role, role)
  localStorage.setItem(K.user, JSON.stringify(user))
  if (refreshToken) localStorage.setItem(K.refresh, refreshToken)
}

export function saveAccessToken(accessToken: string) {
  localStorage.setItem(K.token, accessToken)
}

export function clearAuth() {
  Object.values(K).forEach((k) => localStorage.removeItem(k))
}
