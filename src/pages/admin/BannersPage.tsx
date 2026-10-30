import { useEffect, useRef, useState } from 'react'
import { api } from '../../lib/api'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY as string
const BUCKET = 'medicine-images'

interface Banner {
  id: string
  title: string
  subtitle: string | null
  imageUrl: string | null
  bgColor: string
  medicineId: string | null
  searchQuery: string | null
  isActive: boolean
}

interface MedicineOption {
  id: string
  nameRu: string
  dosage: string | null
  form: string | null
}

const DEFAULT_COLORS = ['#16a273', '#2563eb', '#7c3aed', '#dc2626']

async function uploadToSupabase(file: File): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `banner-${Date.now()}.${ext}`
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': file.type,
    },
    body: file,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.message ?? 'Upload failed')
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
}

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [bgColor, setBgColor] = useState('#16a273')
  const [medicineId, setMedicineId] = useState('')
  const [medicineName, setMedicineName] = useState('')
  const [medSearch, setMedSearch] = useState('')
  const [medResults, setMedResults] = useState<MedicineOption[]>([])
  const [medLoading, setMedLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const r = await api.get<Banner[]>('/banners/all')
    setBanners(r.data)
  }

  async function searchMedicines(q: string) {
    setMedSearch(q)
    if (!q.trim()) { setMedResults([]); return }
    setMedLoading(true)
    try {
      const r = await api.get<MedicineOption[]>(`/admin/medicines?search=${encodeURIComponent(q)}`)
      setMedResults(r.data.slice(0, 8))
    } finally { setMedLoading(false) }
  }

  function pickMedicine(m: MedicineOption) {
    setMedicineId(m.id)
    setMedicineName(m.nameRu + (m.dosage ? ` ${m.dosage}` : ''))
    setMedSearch('')
    setMedResults([])
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToSupabase(file)
      setImageUrl(url)
    } catch (err: any) {
      alert(`Ошибка загрузки: ${err.message}`)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function resetForm() {
    setTitle(''); setSubtitle(''); setImageUrl('')
    setBgColor('#16a273'); setMedicineId(''); setMedicineName('')
    setMedSearch(''); setMedResults([])
    setShowForm(false)
  }

  async function add() {
    if (!title.trim()) return
    setBusy(true)
    try {
      await api.post('/banners', {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        imageUrl: imageUrl || null,
        bgColor,
        medicineId: medicineId || null,
        isActive: true,
      })
      resetForm()
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

          {/* Image upload */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Изображение</label>
            <div className="flex items-center gap-3">
              {imageUrl && (
                <div className="relative">
                  <img src={imageUrl} className="w-24 h-14 object-cover rounded-lg border border-gray-200" />
                  <button onClick={() => setImageUrl('')}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600">
                    ×
                  </button>
                </div>
              )}
              <div>
                <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  className="px-3 py-2 border border-gray-300 text-sm text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-40">
                  {uploading ? 'Загрузка...' : imageUrl ? 'Заменить' : '📷 Загрузить фото'}
                </button>
                <p className="text-xs text-gray-400 mt-1">Рекомендуется 520 × 260 px</p>
              </div>
            </div>
          </div>

          {/* Medicine picker */}
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Лекарство (при нажатии открывается карточка)</label>
            {medicineId ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-[#16a273] rounded-lg bg-[#f0fdf8]">
                <span className="text-sm text-gray-800 flex-1">{medicineName}</span>
                <button onClick={() => { setMedicineId(''); setMedicineName('') }}
                  className="text-xs text-gray-400 hover:text-gray-600">✕</button>
              </div>
            ) : (
              <>
                <input value={medSearch} onChange={e => searchMedicines(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#16a273]"
                  placeholder="Поиск лекарства..." />
                {medLoading && <p className="text-xs text-gray-400 mt-1">Поиск...</p>}
                {medResults.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {medResults.map(m => (
                      <button key={m.id} onClick={() => pickMedicine(m)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 border-b border-gray-100 last:border-0">
                        <span className="font-medium text-gray-900">{m.nameRu}</span>
                        {m.dosage && <span className="text-gray-500 ml-1">{m.dosage}</span>}
                        {m.form && <span className="text-gray-400 ml-1 text-xs">· {m.form}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Color */}
          <div>
            <label className="text-xs text-gray-500 mb-2 block">Цвет фона {imageUrl ? '(используется если нет фото)' : ''}</label>
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
            <div>
              <p className="text-xs text-gray-500 mb-1">Предпросмотр</p>
              <div className="rounded-xl overflow-hidden h-24 flex items-end p-3"
                style={{ backgroundColor: bgColor, backgroundImage: imageUrl ? `url(${imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="bg-black/30 px-2 py-1 rounded">
                  <p className="font-bold text-white text-sm">{title}</p>
                  {subtitle && <p className="text-white text-xs opacity-80">{subtitle}</p>}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={add} disabled={!title.trim() || busy}
              className="px-4 py-2 bg-[#16a273] text-white text-sm font-medium rounded-lg hover:bg-[#13916a] disabled:opacity-40">
              {busy ? '...' : 'Добавить'}
            </button>
            <button onClick={resetForm}
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
            <div className="w-24 h-20 flex-shrink-0"
              style={{ backgroundColor: b.bgColor, backgroundImage: b.imageUrl ? `url(${b.imageUrl})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!b.imageUrl && (
                <div className="w-full h-full flex items-end p-2">
                  <p className="text-white text-xs font-bold leading-tight">{b.title}</p>
                </div>
              )}
            </div>
            <div className="flex-1 p-3 min-w-0">
              <p className="font-medium text-gray-900 text-sm">{b.title}</p>
              {b.subtitle && <p className="text-xs text-gray-500">{b.subtitle}</p>}
              {b.medicineId && <p className="text-xs text-[#16a273] mt-0.5">💊 Открывает карточку лекарства</p>}
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
