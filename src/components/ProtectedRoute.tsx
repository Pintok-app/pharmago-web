import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { getAuth, type Role } from '../store/authStore'

export function ProtectedRoute({ children, role }: { children: ReactNode; role: Role }) {
  const auth = getAuth()
  if (!auth.token) return <Navigate to="/login" replace />
  if (auth.role !== role) return <Navigate to="/login" replace />
  return <>{children}</>
}
