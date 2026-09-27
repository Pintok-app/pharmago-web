import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { saveAuth, type AuthUser, type Role } from '../store/authStore'

export function LoginPage() {
  const nav = useNavigate()
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // Try pharmacist first; on 401 fall through to admin
      let role: Role = 'pharmacist'
      const pharmacistRes = await api.post('/auth/pharmacist-login', { login, password }).catch(() => null)
      const res = pharmacistRes ?? (() => { role = 'admin'; return api.post('/auth/admin-login', { login, password }) })()
      const { accessToken, user } = (await res).data as { accessToken: string; role: Role; user: AuthUser }
      saveAuth(accessToken, role, user)
      nav(role === 'admin' ? '/admin/dashboard' : '/pharmacist/orders', { replace: true })
    } catch {
      setError('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="w-12 h-12 bg-[#16a273] rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-xl font-bold">P</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900">PharmaGo</h1>
          <p className="text-sm text-gray-500 mt-1">Войдите в свой аккаунт</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273] focus:border-transparent"
              placeholder="shimbay1"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273] focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#16a273] text-white rounded-lg py-2 text-sm font-medium hover:bg-[#13916a] transition-colors disabled:opacity-50"
          >
            {loading ? 'Входим...' : 'Войти'}
          </button>
        </form>
      </div>
    </div>
  )
}
