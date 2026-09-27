export type Role = 'pharmacist' | 'admin'

export interface AuthUser {
  id: string
  name: string
  pharmacyId?: string
}

interface AuthState {
  token: string | null
  role: Role | null
  user: AuthUser | null
}

const K = { token: 'pg_token', role: 'pg_role', user: 'pg_user' }

export function getAuth(): AuthState {
  const raw = localStorage.getItem(K.user)
  return {
    token: localStorage.getItem(K.token),
    role: localStorage.getItem(K.role) as Role | null,
    user: raw ? (JSON.parse(raw) as AuthUser) : null,
  }
}

export function saveAuth(token: string, role: Role, user: AuthUser) {
  localStorage.setItem(K.token, token)
  localStorage.setItem(K.role, role)
  localStorage.setItem(K.user, JSON.stringify(user))
}

export function clearAuth() {
  Object.values(K).forEach((k) => localStorage.removeItem(k))
}
