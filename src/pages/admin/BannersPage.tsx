import { useEffect, useState } from 'react'
import { api } from '../../lib/api'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  bgColor: string
  searchQuery: string | null
  isActive: boolean
}

const DEFAULT_COLORS = ['#16a273', '#2563eb', '#7c3aed', '#dc2626']

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [bgColor, setBgColor] = useState('#16a273')
  const [searchQuery, setSearchQuery] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const r = await api.get<Banner[]>('/banners/all')
    setBanners(r.data)
  }

  async function add() {
    if (!title.trim()) return
    setBusy(true)
    try {
      await api.post('/banners', {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        imageUrl: imageUrl.trim() || null,
        bgColor,
        searchQuery: searchQuery.trim() || null,
        isActive: true,
      })
      setTitle(''); setSubtitle(''); setImageUrl(''); setBgColor('#16a273'); setSearchQuery('')
      setShowForm(false)
      load()
    } finally { setBusy(false) }
  }

  async function remove(id: string) {
    if (!confirm('Удалить баннер?')) return
    await api.delete(`/banners/${id}`)
    load()
  }

  const canAdd = banners.length < 4

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Баннеры</h1>
          <p className="text-sm text-gray-500 mt-0.5">{banners.length}/4 баннеров</p>
        </div>
        {canAdd && !showForm && (
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-[#16a273] text-white text-sm font-medium rounded-lg hover:bg-[#13916a]">
            + Добавить
          </button>
        )}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <h2 className="font-medium text-gray-900">Новый баннер</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Заголовок *</label>
              <input value={title} onChange={e => setTitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#16a273]"
                placeholder="Витамины" />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Подзаголовок</label>
              <input value={subtitle} onChange={e => setSubtitle(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#16a273]"
                placeholder="Большой выбор" />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">URL изображения (необязательно)</label>
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#16a273]"
              placeholder="https://..." />
            <p className="text-xs text-gray-400 mt-1">Рекомендуемый размер: <strong>520 × 260 px</strong> (соотношение 2:1). Форматы: JPG, PNG, WebP.</p>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">Поиск при нажатии</label>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#16a273]"
              placeholder="Витамин C" />
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-2 block">Цвет фона</label>
            <div className="flex items-center gap-2">
              {DEFAULT_COLORS.map(c => (
                <button key={c} onClick={() => setBgColor(c)}
                  className={`w-8 h-8 rounded-full border-2 ${bgColor === c ? 'border-gray-900 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <input type="color" value={bgColor} onChange={e => setBgColor(e.target.value)}
                className="w-8 h-8 rounded-full border border-gray-300 cursor-pointer" />
            </div>
          </div>

          {/* Preview */}
          {title && (
            <div className="rounded-xl overflow-hidden h-24 flex items-end p-3"
              style={{ backgroundColor: bgColor, backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div>
                <p className="font-bold text-white text-sm">{title}</p>
                {subtitle && <p className="text-white text-xs opacity-80">{subtitle}</p>}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={add} disabled={!title.trim() || busy}
              className="px-4 py-2 bg-[#16a273] text-white text-sm font-medium rounded-lg hover:bg-[#13916a] disabled:opacity-40">
              {busy ? '...' : 'Добавить'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Banner list */}
      <div className="space-y-3">
        {banners.length === 0 && (
          <p className="text-sm text-gray-400 py-4 text-center">Баннеров нет. Добавьте до 4 баннеров.</p>
        )}
        {banners.map(b => (
          <div key={b.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex">
            <div className="w-24 h-20 flex-shrink-0 flex items-end p-2"
              style={{ backgroundColor: b.bgColor, backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!b.imageUrl && <p className="text-white text-xs font-bold leading-tight">{b.title}</p>}
            </div>
            <div className="flex-1 p-3 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{b.title}</p>
              {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
              {b.searchQuery && <p className="text-xs text-[#16a273] mt-0.5">→ {b.searchQuery}</p>}
            </div>
            <div className="p-3 flex items-center">
              <button onClick={() => remove(b.id)}
                className="text-xs text-red-400 hover:text-red-600 px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50">
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
