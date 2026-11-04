import { type FormEvent, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { saveAuth, type AuthUser, type Role } from '../store/authStore'

export function LoginPage() {
  const nav = useNavigate()
  const [role, setRole] = useState<Role>('pharmacist')
  const [login, setLogin] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = role === 'admin' ? '/auth/admin-login' : '/auth/pharmacist-login'
      const { data } = await api.post(endpoint, { login, password })
      const { accessToken, refreshToken, user } = data as { accessToken: string; refreshToken: string; user: AuthUser }
      saveAuth(accessToken, role, user, refreshToken)
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

        {/* Role selector */}
        <div className="flex rounded-lg border border-gray-200 p-1 mb-6 bg-gray-50">
          <button
            type="button"
            onClick={() => { setRole('pharmacist'); setError('') }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === 'pharmacist'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Фармацевт
          </button>
          <button
            type="button"
            onClick={() => { setRole('admin'); setError('') }}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              role === 'admin'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Администратор
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273] focus:border-transparent"
              placeholder={role === 'admin' ? 'admin' : 'shimbay1'}
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
