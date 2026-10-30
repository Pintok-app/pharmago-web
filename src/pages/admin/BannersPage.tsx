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
  isActive: boolean
}

interface MedicineOption {
  id: string
  nameRu: string
  dosage: string | null
  form: string | null
}

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
    throw new Error(err.message ?? `Upload failed: ${res.status}`)
  }
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${filename}`
}

export function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [imageUrl, setImageUrl] = useState('')
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
    setMedicineId(''); setMedicineName('')
    setMedSearch(''); setMedResults([])
    setShowForm(false)
  }

  async function add() {
    if (!title.trim() || !imageUrl) return
    setBusy(true)
    try {
      await api.post('/banners', {
        title: title.trim(),
        subtitle: subtitle.trim() || null,
        imageUrl,
        bgColor: '#16a273',
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

          {/* Image upload — required */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Изображение *</label>
            {imageUrl ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-gray-200">
                <img src={imageUrl} className="w-full h-full object-cover" />
                <button onClick={() => setImageUrl('')}
                  className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full text-sm flex items-center justify-center hover:bg-red-600 font-bold">
                  ×
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="w-full h-36 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-[#16a273] hover:text-[#16a273] transition-colors disabled:opacity-40 flex flex-col items-center justify-center gap-1">
                {uploading ? (
                  <>
                    <span className="text-2xl">⏳</span>
                    <span>Загрузка...</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">📷</span>
                    <span>Нажмите чтобы загрузить фото</span>
                    <span className="text-xs">Рекомендуется 520 × 260 px</span>
                  </>
                )}
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

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
                placeholder="Скидки этой недели" />
            </div>
          </div>

          {/* Medicine picker */}
          <div className="relative">
            <label className="text-xs text-gray-500 mb-1 block">Лекарство (при нажатии откроется карточка)</label>
            {medicineId ? (
              <div className="flex items-center gap-2 px-3 py-2 border border-[#16a273] rounded-lg bg-[#f0fdf8]">
                <span className="text-sm text-gray-800 flex-1">💊 {medicineName}</span>
                <button onClick={() => { setMedicineId(''); setMedicineName('') }}
                  className="text-xs text-gray-400 hover:text-gray-600">✕ убрать</button>
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

          <div className="flex gap-2 pt-1">
            <button onClick={add} disabled={!title.trim() || !imageUrl || busy}
              className="px-4 py-2 bg-[#16a273] text-white text-sm font-medium rounded-lg hover:bg-[#13916a] disabled:opacity-40">
              {busy ? 'Сохранение...' : 'Добавить баннер'}
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
            <div className="w-28 h-20 flex-shrink-0 bg-gray-100">
              {b.imageUrl
                ? <img src={b.imageUrl} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">🖼️</div>
              }
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
