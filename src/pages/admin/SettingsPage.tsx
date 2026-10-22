import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Settings {
  delivery_fee_flat: string
  free_delivery_before_hour: string
}

type SettingKey = keyof Settings

export function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    delivery_fee_flat: '',
    free_delivery_before_hour: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<Partial<Record<SettingKey, boolean>>>({})
  const [saved, setSaved] = useState<Partial<Record<SettingKey, boolean>>>({})

  useEffect(() => {
    api.get<Settings>('/admin/settings')
      .then((r) => setSettings(r.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function saveSetting(key: SettingKey) {
    setSaving((s) => ({ ...s, [key]: true }))
    try {
      await api.patch('/admin/settings', { key, value: settings[key] })
      setSaved((s) => ({ ...s, [key]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 2000)
    } finally {
      setSaving((s) => ({ ...s, [key]: false }))
    }
  }

  if (loading) return <div className="py-12 text-center text-gray-400">Загрузка...</div>

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <h1 className="text-xl font-semibold text-gray-900">Настройки</h1>

      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="p-5">
          <label className="block text-sm font-medium text-gray-800 mb-0.5">
            Стоимость доставки (сум)
          </label>
          <p className="text-xs text-gray-400 mb-3">Плата после бесплатного периода</p>
          <div className="flex gap-2">
            <input
              type="number"
              value={settings.delivery_fee_flat}
              onChange={(e) => setSettings((s) => ({ ...s, delivery_fee_flat: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]"
            />
            <button
              onClick={() => saveSetting('delivery_fee_flat')}
              disabled={!!saving.delivery_fee_flat}
              className="px-4 py-2 bg-[#16a273] text-white rounded-lg text-sm font-medium hover:bg-[#13916a] disabled:opacity-50 min-w-[100px]"
            >
              {saved.delivery_fee_flat ? '✓ Готово' : saving.delivery_fee_flat ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>

        <div className="p-5">
          <label className="block text-sm font-medium text-gray-800 mb-0.5">
            Час бесплатной доставки
          </label>
          <p className="text-xs text-gray-400 mb-3">До этого часа доставка бесплатна (0–23)</p>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              max={23}
              value={settings.free_delivery_before_hour}
              onChange={(e) => setSettings((s) => ({ ...s, free_delivery_before_hour: e.target.value }))}
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]"
            />
            <button
              onClick={() => saveSetting('free_delivery_before_hour')}
              disabled={!!saving.free_delivery_before_hour}
              className="px-4 py-2 bg-[#16a273] text-white rounded-lg text-sm font-medium hover:bg-[#13916a] disabled:opacity-50 min-w-[100px]"
            >
              {saved.free_delivery_before_hour ? '✓ Готово' : saving.free_delivery_before_hour ? '...' : 'Сохранить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
