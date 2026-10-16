import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface SyncLog {
  status: string
  finishedAt: string | null
  itemsProcessed: number
}

interface Pharmacy {
  id: string
  name: string
  address: string
  isClosed: boolean
  closeReason: string | null
  workingHoursStart: string
  workingHoursEnd: string
  isActive: boolean
  syncLogs: SyncLog[]
}

function SyncBadge({ logs }: { logs: SyncLog[] }) {
  const last = logs[0]
  if (!last || !last.finishedAt) {
    return <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Нет синхр.</span>
  }
  const mins = Math.floor((Date.now() - new Date(last.finishedAt).getTime()) / 60_000)
  if (last.status === 'failed') {
    return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Ошибка синхр.</span>
  }
  if (mins > 60) {
    const hrs = Math.floor(mins / 60)
    return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">⚠️ {hrs}ч без синхр.</span>
  }
  if (mins > 20) {
    return <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">⚠️ {mins}мин назад</span>
  }
  return <span className="text-xs bg-green-50 text-green-600 px-2 py-0.5 rounded-full">✓ {mins}мин назад · {last.itemsProcessed} товаров</span>
}

interface City {
  id: string
  name: string
  isActive: boolean
  pharmacies: Pharmacy[]
}

export function PharmaciesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [loadingBtn, setLoadingBtn] = useState<Record<string, boolean>>({})
  const [closeReasons, setCloseReasons] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [])

  async function load() {
    const r = await api.get<City[]>('/admin/cities')
    setCities(r.data)
  }

  async function toggleOpen(city: City, pharmacy: Pharmacy) {
    const key = `open-${pharmacy.id}`
    setLoadingBtn((l) => ({ ...l, [key]: true }))
    try {
      if (pharmacy.isClosed) {
        await api.patch(`/admin/pharmacies/${pharmacy.id}/open`)
      } else {
        const reason = closeReasons[pharmacy.id]?.trim() || 'Временно закрыто'
        await api.patch(`/admin/pharmacies/${pharmacy.id}/close`, { reason })
      }
      patch(city.id, pharmacy.id, { isClosed: !pharmacy.isClosed, closeReason: pharmacy.isClosed ? null : (closeReasons[pharmacy.id]?.trim() || 'Временно закрыто') })
    } finally {
      setLoadingBtn((l) => ({ ...l, [key]: false }))
    }
  }

  async function toggleActive(city: City, pharmacy: Pharmacy) {
    const key = `active-${pharmacy.id}`
    setLoadingBtn((l) => ({ ...l, [key]: true }))
    try {
      await api.patch(`/admin/pharmacies/${pharmacy.id}/${pharmacy.isActive ? 'deactivate' : 'activate'}`)
      patch(city.id, pharmacy.id, { isActive: !pharmacy.isActive })
    } finally {
      setLoadingBtn((l) => ({ ...l, [key]: false }))
    }
  }

  async function toggleCityActive(city: City) {
    const key = `city-${city.id}`
    setLoadingBtn((l) => ({ ...l, [key]: true }))
    try {
      await api.patch(`/admin/cities/${city.id}/${city.isActive ? 'deactivate' : 'activate'}`)
      setCities((prev) => prev.map((c) => c.id === city.id ? { ...c, isActive: !c.isActive } : c))
    } finally {
      setLoadingBtn((l) => ({ ...l, [key]: false }))
    }
  }

  function patch(cityId: string, pharmacyId: string, updates: Partial<Pharmacy>) {
    setCities((prev) => prev.map((c) =>
      c.id === cityId
        ? { ...c, pharmacies: c.pharmacies.map((p) => p.id === pharmacyId ? { ...p, ...updates } : p) }
        : c
    ))
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Аптеки</h1>

      {cities.map((city) => (
        <div key={city.id} className={`rounded-xl border p-4 ${city.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50'}`}>
          {/* City header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{city.name}</h2>
              {city.isActive
                ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">В приложении</span>
                : <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Скрыт</span>
              }
            </div>
            <button
              onClick={() => toggleCityActive(city)}
              disabled={!!loadingBtn[`city-${city.id}`]}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                city.isActive
                  ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  : 'bg-[#16a273] text-white hover:bg-[#13916a]'
              }`}
            >
              {loadingBtn[`city-${city.id}`] ? '...' : city.isActive ? 'Скрыть город' : 'Показать город'}
            </button>
          </div>

          {/* Pharmacies */}
          <div className="space-y-2">
            {city.pharmacies.map((pharmacy) => (
              <div
                key={pharmacy.id}
                className={`rounded-lg border p-3 flex items-center justify-between gap-3 ${
                  !pharmacy.isActive ? 'border-gray-100 bg-gray-50 opacity-60' :
                  pharmacy.isClosed ? 'border-red-200 bg-red-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-gray-900 text-sm">{pharmacy.name}</p>
                    {!pharmacy.isActive && (
                      <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">Отключена</span>
                    )}
                    {pharmacy.isActive && pharmacy.isClosed && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Закрыто</span>
                    )}
                    {pharmacy.isActive && <SyncBadge logs={pharmacy.syncLogs} />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {pharmacy.address} · {pharmacy.workingHoursStart}–{pharmacy.workingHoursEnd}
                  </p>
                  {pharmacy.isClosed && pharmacy.closeReason && (
                    <p className="text-xs text-red-400 mt-0.5">Причина: {pharmacy.closeReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Activate / Deactivate in app */}
                  <button
                    onClick={() => toggleActive(city, pharmacy)}
                    disabled={!!loadingBtn[`active-${pharmacy.id}`]}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                      pharmacy.isActive
                        ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                        : 'bg-[#16a273] text-white hover:bg-[#13916a]'
                    }`}
                  >
                    {loadingBtn[`active-${pharmacy.id}`] ? '...' : pharmacy.isActive ? 'Отключить' : 'Включить'}
                  </button>

                  {/* Open / Close for the day — only relevant when active */}
                  {pharmacy.isActive && (
                    <>
                      {!pharmacy.isClosed && (
                        <input
                          type="text"
                          placeholder="Причина закрытия"
                          value={closeReasons[pharmacy.id] ?? ''}
                          onChange={(e) => setCloseReasons((r) => ({ ...r, [pharmacy.id]: e.target.value }))}
                          className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-36 focus:outline-none focus:ring-1 focus:ring-[#16a273]"
                        />
                      )}
                      <button
                        onClick={() => toggleOpen(city, pharmacy)}
                        disabled={!!loadingBtn[`open-${pharmacy.id}`]}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${
                          pharmacy.isClosed
                            ? 'bg-[#16a273] text-white hover:bg-[#13916a]'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {loadingBtn[`open-${pharmacy.id}`] ? '...' : pharmacy.isClosed ? 'Открыть' : 'Закрыть'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
