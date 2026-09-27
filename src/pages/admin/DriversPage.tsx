import { type FormEvent, useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface City { id: string; name: string }
interface Driver {
  id: string
  name: string
  phone: string
  isOnline: boolean
  totalDeliveries: number
}

export function DriversPage() {
  const [cities, setCities] = useState<City[]>([])
  const [selectedCity, setSelectedCity] = useState('')
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<Record<string, boolean>>({})
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newPhone, setNewPhone] = useState('')
  const [newCityId, setNewCityId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    api.get<City[]>('/cities').then((r) => {
      setCities(r.data)
      if (r.data.length > 0) {
        setSelectedCity(r.data[0].id)
        setNewCityId(r.data[0].id)
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedCity) return
    setLoading(true)
    api.get<Driver[]>('/admin/drivers', { params: { cityId: selectedCity } })
      .then((r) => setDrivers(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedCity])

  async function createDriver(e: FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      await api.post('/admin/drivers', { name: newName, phone: newPhone, cityId: newCityId })
      setShowCreate(false)
      setNewName('')
      setNewPhone('')
      const r = await api.get<Driver[]>('/admin/drivers', { params: { cityId: selectedCity } })
      setDrivers(r.data)
    } finally {
      setSubmitting(false)
    }
  }

  async function deactivate(id: string) {
    setDeleteLoading((l) => ({ ...l, [id]: true }))
    try {
      await api.delete(`/admin/drivers/${id}`)
      setDrivers((prev) => prev.filter((d) => d.id !== id))
    } finally {
      setDeleteLoading((l) => ({ ...l, [id]: false }))
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Водители</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#16a273] text-white rounded-lg text-sm font-medium hover:bg-[#13916a] transition-colors"
        >
          + Добавить
        </button>
      </div>

      <div className="flex gap-2">
        {cities.map((city) => (
          <button
            key={city.id}
            onClick={() => setSelectedCity(city.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              selectedCity === city.id
                ? 'bg-[#16a273] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {city.name}
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
                <th className="text-left px-4 py-3 font-medium text-gray-500">Телефон</th>
                <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
                <th className="text-right px-4 py-3 font-medium text-gray-500">Доставок</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {drivers.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Водителей нет</td></tr>
              )}
              {drivers.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{d.name}</td>
                  <td className="px-4 py-3 text-gray-600">{d.phone}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      d.isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${d.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {d.isOnline ? 'Онлайн' : 'Оффлайн'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.totalDeliveries}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => deactivate(d.id)}
                      disabled={!!deleteLoading[d.id]}
                      className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
                    >
                      {deleteLoading[d.id] ? '...' : 'Удалить'}
                    </button>
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
            <h2 className="font-semibold text-gray-900 mb-4">Новый водитель</h2>
            <form onSubmit={createDriver} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон</label>
                <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+998901234567" required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Город</label>
                <select value={newCityId} onChange={(e) => setNewCityId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]">
                  {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
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
