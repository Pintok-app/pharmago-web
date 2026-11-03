import { type FormEvent, useEffect, useState } from 'react'
import { api } from '../../lib/api'
import { getAuth } from '../../store/authStore'

interface Medicine {
  id: string
  inventoryId: string
  nameRu: string
  dosage: string | null
  price: number       // pack price
  quantity: number    // packs in stock
  packSize: number
  canSellPiece: boolean
  pharmacyName: string
  pharmacyId: string
}

interface CartItem {
  medicineId: string
  name: string
  packs: number
  pieces: number
  packSize: number
  packPrice: number
  piecePrice: number
}

interface Props {
  onClose(): void
  onCreated(): void
}

function cartQty(item: CartItem) { return item.packs * item.packSize + item.pieces }
function cartPrice(item: CartItem) { return item.packs * item.packPrice + item.pieces * item.piecePrice }

export function CreateOrderModal({ onClose, onCreated }: Props) {
  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Medicine[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [phone, setPhone] = useState('+998')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const pharmacyId = getAuth().user?.pharmacyId

  useEffect(() => {
    if (search.length < 2 || !pharmacyId) { setResults([]); return }
    const t = setTimeout(() => {
      api.get<{ data: Medicine[] }>('/medicines', { params: { pharmacyId, search, limit: 20 } })
        .then((r) => setResults(r.data.data ?? []))
        .catch(() => {})
    }, 350)
    return () => clearTimeout(t)
  }, [search, pharmacyId])

  function addToCart(m: Medicine) {
    const packSize = Math.max(1, m.packSize ?? 1)
    const packPrice = m.price
    const piecePrice = packSize > 1 ? Math.ceil(packPrice / packSize) : packPrice
    setCart((prev) => {
      if (prev.find((i) => i.medicineId === m.id)) return prev
      return [...prev, {
        medicineId: m.id,
        name: `${m.nameRu}${m.dosage ? ' ' + m.dosage : ''}`,
        packs: packSize > 1 ? 1 : 0,
        pieces: packSize > 1 ? 0 : 1,
        packSize,
        packPrice,
        piecePrice,
      }]
    })
    setSearch('')
    setResults([])
  }

  function changePacks(medicineId: string, delta: number) {
    setCart(prev => prev
      .map(i => i.medicineId === medicineId ? { ...i, packs: Math.max(0, i.packs + delta) } : i)
      .filter(i => cartQty(i) > 0)
    )
  }

  function changePieces(medicineId: string, delta: number) {
    setCart(prev => prev
      .map(i => {
        if (i.medicineId !== medicineId) return i
        const maxPieces = i.packSize > 1 ? i.packSize - 1 : 999
        return { ...i, pieces: Math.max(0, Math.min(i.pieces + delta, maxPieces)) }
      })
      .filter(i => cartQty(i) > 0)
    )
  }

  const total = cart.reduce((s, i) => s + cartPrice(i), 0)

  async function submit(e: FormEvent) {
    e.preventDefault()
    if (cart.length === 0) { setError('Добавьте хотя бы один препарат'); return }
    if (!address.trim()) { setError('Укажите адрес доставки'); return }
    if (!phone.trim()) { setError('Укажите телефон клиента'); return }
    setError('')
    setSubmitting(true)
    try {
      await api.post('/pharmacist/orders/create', {
        items: cart.map((i) => ({ medicineId: i.medicineId, quantity: cartQty(i) })),
        deliveryAddress: address.trim(),
        anonymousPhone: phone.trim(),
        anonymousName: name.trim() || undefined,
      })
      onCreated()
      onClose()
    } catch (e: unknown) {
      const msg = (e as any)?.response?.data?.message ?? 'Ошибка при создании заказа'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 text-lg">📞 Создать заказ</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={submit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 p-5 space-y-4">

            {/* Medicine search */}
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск препарата..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]"
              />
              {results.length > 0 && (
                <div className="absolute z-10 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {results.map((m) => (
                    <button
                      key={m.inventoryId}
                      type="button"
                      onClick={() => addToCart(m)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 flex justify-between items-center"
                    >
                      <span className="text-gray-800">{m.nameRu}{m.dosage ? ` ${m.dosage}` : ''}</span>
                      <span className="text-gray-500 ml-2 shrink-0 text-xs">
                        {m.price.toLocaleString()} сум{m.packSize > 1 ? `/уп (×${m.packSize})` : ''}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Cart */}
            {cart.length > 0 && (
              <div className="bg-gray-50 rounded-lg divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.medicineId} className="px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-medium">{item.name}</span>
                      <span className="text-sm text-gray-500">{cartPrice(item).toLocaleString()} сум</span>
                    </div>
                    {item.packSize > 1 ? (
                      <div className="flex gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="text-xs text-gray-400 w-14">Упак:</span>
                          <button type="button" onClick={() => changePacks(item.medicineId, -1)}
                            className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs">−</button>
                          <span className="w-5 text-center font-medium">{item.packs}</span>
                          <button type="button" onClick={() => changePacks(item.medicineId, 1)}
                            className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs">+</button>
                        </div>
                        {item.piecePrice > 0 && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="text-xs text-gray-400 w-14">Штучно:</span>
                            <button type="button" onClick={() => changePieces(item.medicineId, -1)}
                              className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs">−</button>
                            <span className="w-5 text-center font-medium">{item.pieces}</span>
                            <button type="button" onClick={() => changePieces(item.medicineId, 1)}
                              className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs">+</button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => changePieces(item.medicineId, -1)}
                          className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 flex items-center justify-center">−</button>
                        <span className="text-sm font-medium w-5 text-center">{item.pieces}</span>
                        <button type="button" onClick={() => changePieces(item.medicineId, 1)}
                          className="w-6 h-6 rounded-full bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 flex items-center justify-center">+</button>
                      </div>
                    )}
                  </div>
                ))}
                <div className="flex justify-between px-3 py-2">
                  <span className="text-sm font-semibold text-gray-700">Итого</span>
                  <span className="text-sm font-bold text-gray-900">{total.toLocaleString()} сум</span>
                </div>
              </div>
            )}

            {/* Customer info */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Телефон клиента *</label>
                <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998901234567"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]"
                  required />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Имя (необязательно)</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Иван"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">Адрес / ориентир *</label>
              <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                placeholder="ул. Центральная 7, 3 этаж, красная дверь"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]"
                required />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <div className="p-5 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
              Отмена
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 py-2 rounded-lg bg-[#16a273] text-white text-sm font-semibold hover:bg-[#13916a] disabled:opacity-50">
              {submitting ? 'Создаём...' : 'Создать заказ →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
