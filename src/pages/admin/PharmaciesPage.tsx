import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface City { id: string; name: string }
interface Pharmacy {
  id: string
  name: string
  address: string
  isClosed: boolean
  closeReason: string | null
  workingHoursStart: string
  workingHoursEnd: string
}

export function PharmaciesPage() {
  const [cities, setCities] = useState<City[]>([])
  const [pharmaciesByCity, setPharmaciesByCity] = useState<Record<string, Pharmacy[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const [closeReasons, setCloseReasons] = useState<Record<string, string>>({})

  useEffect(() => {
    api.get<City[]>('/cities').then((r) => {
      setCities(r.data)
      r.data.forEach((city) => {
        api.get<Pharmacy[]>(`/cities/${city.id}/pharmacies`)
          .then((rp) => setPharmaciesByCity((prev) => ({ ...prev, [city.id]: rp.data })))
          .catch(() => {})
      })
    }).catch(() => {})
  }, [])

  async function toggle(cityId: string, pharmacy: Pharmacy) {
    const id = pharmacy.id
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      if (pharmacy.isClosed) {
        await api.patch(`/admin/pharmacies/${id}/open`)
      } else {
        const reason = closeReasons[id]?.trim() || 'Временно закрыто'
        await api.patch(`/admin/pharmacies/${id}/close`, { reason })
      }
      setPharmaciesByCity((prev) => ({
        ...prev,
        [cityId]: prev[cityId].map((p) =>
          p.id === id ? { ...p, isClosed: !p.isClosed } : p
        ),
      }))
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Аптеки</h1>

      {cities.map((city) => (
        <div key={city.id}>
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{city.name}</h2>
          <div className="space-y-3">
            {(pharmaciesByCity[city.id] ?? []).map((pharmacy) => (
              <div
                key={pharmacy.id}
                className={`bg-white rounded-xl border p-4 flex items-center justify-between gap-4 ${
                  pharmacy.isClosed ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{pharmacy.name}</p>
                    {pharmacy.isClosed && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Закрыто</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {pharmacy.address} · {pharmacy.workingHoursStart}–{pharmacy.workingHoursEnd}
                  </p>
                  {pharmacy.isClosed && pharmacy.closeReason && (
                    <p className="text-xs text-red-500 mt-0.5">Причина: {pharmacy.closeReason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!pharmacy.isClosed && (
                    <input
                      type="text"
                      placeholder="Причина закрытия"
                      value={closeReasons[pharmacy.id] ?? ''}
                      onChange={(e) => setCloseReasons((r) => ({ ...r, [pharmacy.id]: e.target.value }))}
                      className="border border-gray-300 rounded-lg px-2 py-1 text-xs w-40 focus:outline-none focus:ring-1 focus:ring-[#16a273]"
                    />
                  )}
                  <button
                    onClick={() => toggle(city.id, pharmacy)}
                    disabled={!!loading[pharmacy.id]}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                      pharmacy.isClosed
                        ? 'bg-[#16a273] text-white hover:bg-[#13916a]'
                        : 'bg-red-500 text-white hover:bg-red-600'
                    }`}
                  >
                    {loading[pharmacy.id] ? '...' : pharmacy.isClosed ? 'Открыть' : 'Закрыть'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
