import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface SyncLog { status: string; finishedAt: string | null; itemsProcessed: number }
interface Pharmacy {
  id: string; name: string; address: string
  isClosed: boolean; closeReason: string | null
  workingHoursStart: string; workingHoursEnd: string
  isActive: boolean; syncLogs: SyncLog[]
}
interface City { id: string; name: string; isActive: boolean; pharmacies: Pharmacy[] }

function SyncBadge({ logs }: { logs: SyncLog[] }) {
  const last = logs[0]
  if (!last?.finishedAt) return <span className="text-xs text-gray-400">Нет синхр.</span>
  const mins = Math.floor((Date.now() - new Date(last.finishedAt).getTime()) / 60_000)
  if (last.status === 'failed') return <span className="text-xs text-red-500">⚠ Ошибка синхр.</span>
  if (mins > 60) return <span className="text-xs text-red-500">⚠ {Math.floor(mins/60)}ч без синхр.</span>
  if (mins > 20) return <span className="text-xs text-yellow-600">⚠ {mins} мин назад</span>
  return <span className="text-xs text-green-600">✓ {mins} мин · {last.itemsProcessed} товаров</span>
}

export function PharmaciesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<Record<string, boolean>>({})
  const [closing, setClosing] = useState<string | null>(null)
  const [closeReason, setCloseReason] = useState('')

  useEffect(() => {
    api.get<City[]>('/admin/cities').then(r => setCities(r.data)).finally(() => setLoading(false))
  }, [])

  const set = (key: string, val: boolean) => setBusy(b => ({ ...b, [key]: val }))

  async function toggleCityActive(city: City) {
    set(`city-${city.id}`, true)
    try {
      await api.patch(`/admin/cities/${city.id}/${city.isActive ? 'deactivate' : 'activate'}`)
      setCities(prev => prev.map(c => c.id === city.id ? { ...c, isActive: !c.isActive } : c))
    } finally { set(`city-${city.id}`, false) }
  }

  async function toggleActive(city: City, pharmacy: Pharmacy) {
    set(`active-${pharmacy.id}`, true)
    try {
      await api.patch(`/admin/pharmacies/${pharmacy.id}/${pharmacy.isActive ? 'deactivate' : 'activate'}`)
      patch(city.id, pharmacy.id, { isActive: !pharmacy.isActive })
    } finally { set(`active-${pharmacy.id}`, false) }
  }

  async function openPharmacy(city: City, pharmacy: Pharmacy) {
    set(`open-${pharmacy.id}`, true)
    try {
      await api.patch(`/admin/pharmacies/${pharmacy.id}/open`)
      patch(city.id, pharmacy.id, { isClosed: false, closeReason: null })
    } finally { set(`open-${pharmacy.id}`, false) }
  }

  async function closePharmacy(city: City, pharmacy: Pharmacy) {
    set(`close-${pharmacy.id}`, true)
    try {
      await api.patch(`/admin/pharmacies/${pharmacy.id}/close`, { reason: closeReason.trim() || 'Временно закрыто' })
      patch(city.id, pharmacy.id, { isClosed: true, closeReason: closeReason.trim() || 'Временно закрыто' })
      setClosing(null)
      setCloseReason('')
    } finally { set(`close-${pharmacy.id}`, false) }
  }

  function patch(cityId: string, pharmacyId: string, updates: Partial<Pharmacy>) {
    setCities(prev => prev.map(c =>
      c.id === cityId ? { ...c, pharmacies: c.pharmacies.map(p => p.id === pharmacyId ? { ...p, ...updates } : p) } : c
    ))
  }

  if (loading) return <div className="text-gray-400 text-sm">Загрузка...</div>

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-xl font-semibold text-gray-900">Аптеки</h1>

      {cities.map(city => (
        <div key={city.id}>
          {/* City row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-800">{city.name}</span>
              {city.isActive
                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">в приложении</span>
                : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">скрыт</span>
              }
            </div>
            <button
              onClick={() => toggleCityActive(city)}
              disabled={busy[`city-${city.id}`]}
              className="text-xs text-gray-500 hover:text-gray-800 underline disabled:opacity-40"
            >
              {busy[`city-${city.id}`] ? '...' : city.isActive ? 'Скрыть город' : 'Показать город'}
            </button>
          </div>

          {/* Pharmacy cards */}
          <div className="space-y-3">
            {city.pharmacies.map(pharmacy => (
              <div
                key={pharmacy.id}
                className={`rounded-xl border p-4 bg-white ${
                  !pharmacy.isActive ? 'opacity-50 border-gray-100' :
                  pharmacy.isClosed ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                {/* Top row: name + status */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-900">{pharmacy.name}</span>
                      {pharmacy.isClosed && pharmacy.isActive && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Закрыто</span>
                      )}
                      {!pharmacy.isActive && (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Отключена</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {pharmacy.address} · {pharmacy.workingHoursStart}–{pharmacy.workingHoursEnd}
                    </p>
                    {pharmacy.isClosed && pharmacy.closeReason && (
                      <p className="text-xs text-red-400 mt-0.5">Причина: {pharmacy.closeReason}</p>
                    )}
                    <div className="mt-1">
                      <SyncBadge logs={pharmacy.syncLogs} />
                    </div>
                  </div>

                  {/* Toggle visible in app */}
                  <button
                    onClick={() => toggleActive(city, pharmacy)}
                    disabled={busy[`active-${pharmacy.id}`]}
                    className={`shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors disabled:opacity-40 ${
                      pharmacy.isActive
                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        : 'bg-[#16a273] text-white hover:bg-[#13916a]'
                    }`}
                  >
                    {busy[`active-${pharmacy.id}`] ? '...' : pharmacy.isActive ? 'Отключить' : 'Включить'}
                  </button>
                </div>

                {/* Bottom row: open/close — only when active */}
                {pharmacy.isActive && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    {pharmacy.isClosed ? (
                      <button
                        onClick={() => openPharmacy(city, pharmacy)}
                        disabled={busy[`open-${pharmacy.id}`]}
                        className="text-sm bg-[#16a273] text-white px-4 py-1.5 rounded-lg hover:bg-[#13916a] disabled:opacity-40 font-medium"
                      >
                        {busy[`open-${pharmacy.id}`] ? '...' : '✓ Открыть аптеку'}
                      </button>
                    ) : closing === pharmacy.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          autoFocus
                          type="text"
                          placeholder="Причина (необязательно)"
                          value={closeReason}
                          onChange={e => setCloseReason(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && closePharmacy(city, pharmacy)}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                        />
                        <button
                          onClick={() => closePharmacy(city, pharmacy)}
                          disabled={busy[`close-${pharmacy.id}`]}
                          className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-lg hover:bg-red-600 disabled:opacity-40 font-medium shrink-0"
                        >
                          {busy[`close-${pharmacy.id}`] ? '...' : 'Закрыть'}
                        </button>
                        <button
                          onClick={() => { setClosing(null); setCloseReason('') }}
                          className="text-sm text-gray-400 hover:text-gray-600 px-2"
                        >✕</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setClosing(pharmacy.id); setCloseReason('') }}
                        className="text-sm text-red-500 hover:text-red-700 font-medium"
                      >
                        Закрыть аптеку на сегодня
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
