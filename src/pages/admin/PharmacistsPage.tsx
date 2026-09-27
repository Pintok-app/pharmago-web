import { type FormEvent, useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface City { id: string; name: string }
interface Pharmacy { id: string; name: string }
interface Pharmacist {
  id: string
  name: string
  login: string
  isActive: boolean
}

export function PharmacistsPage() {
  const [pharmacies, setPharmacies] = useState<Pharmacy[]>([])
  const [selectedPharmacy, setSelectedPharmacy] = useState('')
  const [pharmacists, setPharmacists] = useState<Pharmacist[]>([])
  const [loading, setLoading] = useState(false)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newLogin, setNewLogin] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPharmacyId, setNewPharmacyId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<City[]>('/cities').then((r) => {
      const allPharmacies: Pharmacy[] = []
      Promise.all(
        r.data.map((city) =>
          api.get<Pharmacy[]>(`/cities/${city.id}/pharmacies`)
            .then((rp) => allPharmacies.push(...rp.data))
            .catch(() => {})
        )
      ).then(() => {
        setPharmacies(allPharmacies)
        if (allPharmacies.length > 0) {
          setSelectedPharmacy(allPharmacies[0].id)
          setNewPharmacyId(allPharmacies[0].id)
        }
      })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedPharmacy) return
    setLoading(true)
    api.get<Pharmacist[]>('/admin/pharmacists', { params: { pharmacyId: selectedPharmacy } })
      .then((r) => setPharmacists(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedPharmacy])

  async function createPharmacist(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/pharmacists', {
        name: newName,
        login: newLogin,
        password: newPassword,
        pharmacyId: newPharmacyId,
      })
      setShowCreate(false)
      setNewName(''); setNewLogin(''); setNewPassword('')
      const r = await api.get<Pharmacist[]>('/admin/pharmacists', { params: { pharmacyId: selectedPharmacy } })
      setPharmacists(r.data)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Фармацевты</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#16a273] text-white rounded-lg text-sm font-medium hover:bg-[#13916a] transition-colors"
        >
          + Добавить
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {pharmacies.map((p) => (
          <button key={p.id} onClick={() => setSelectedPharmacy(p.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedPharmacy === p.id
                ? 'bg-[#16a273] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-400">Загрузка...</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Имя</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Логин</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pharmacists.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">Фармацевтов нет</td></tr>
              )}
              {pharmacists.map((ph) => (
                <tr key={ph.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{ph.name}</td>
                  <td className="px-4 py-3 text-gray-600">{ph.login}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      ph.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {ph.isActive ? 'Активен' : 'Деактивирован'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-4">Новый фармацевт</h2>
            <form onSubmit={createPharmacist} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Логин</label>
                <input value={newLogin} onChange={(e) => setNewLogin(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Аптека</label>
                <select value={newPharmacyId} onChange={(e) => setNewPharmacyId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]">
                  {pharmacies.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)}
                  className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                  Отмена
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 rounded-lg bg-[#16a273] text-white text-sm font-medium hover:bg-[#13916a] disabled:opacity-50">
                  {submitting ? '...' : 'Создать'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
