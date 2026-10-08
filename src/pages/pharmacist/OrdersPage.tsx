import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useRef, useState } from 'react'
import { CountdownTimer } from '../../components/CountdownTimer'
import { StatusBadge } from '../../components/StatusBadge'
import { useSound } from '../../hooks/useSound'
import { api, API_URL } from '../../lib/api'
import { getAuth } from '../../store/authStore'
import { CreateOrderModal } from './CreateOrderModal'

interface OrderItem {
  medicineId: string
  nameRu: string
  dosage: string
  quantity: number
  unitPrice: number
}

interface Order {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  deliveryAddress: string | null
  customer: { name: string; phone: string }
  items: OrderItem[]
  createdAt: string
}

const REJECT_REASONS = ['Нет в наличии', 'Истёк срок годности', 'Рецептурный препарат', 'Другое']

export function OrdersPage() {
  const [pending, setPending] = useState<Order[]>([])
  const [collecting, setCollecting] = useState<Order[]>([])
  const [checked, setChecked] = useState<Record<string, Set<string>>>({})
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('Нет в наличии')
  const [rejectOther, setRejectOther] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const beep = useSound()
  const soundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  function classifyOrders(orders: Order[]) {
    setPending(orders.filter((o) => o.status === 'AWAITING_PHARMACY'))
    setCollecting(orders.filter((o) => o.status === 'PHARMACY_COLLECTING'))
  }

  useEffect(() => {
    api.get<Order[]>('/pharmacist/orders').then((r) => classifyOrders(r.data)).catch(() => {})

    const token = getAuth().token
    const ctrl = new AbortController()

    fetchEventSource(`${API_URL}/pharmacist/orders/stream`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
      signal: ctrl.signal,
      onmessage(ev) {
        try {
          const data = JSON.parse(ev.data) as { type: string; order: Order }
          if (data.type === 'NEW_ORDER') {
            setPending((prev) =>
              prev.some((o) => o.id === data.order.id)
                ? prev
                : [data.order, ...prev]
            )
            beep()
          }
        } catch { /* ignore */ }
      },
      onerror(err) { throw err },
    }).catch(() => {})

    return () => ctrl.abort()
  }, [beep])

  // Beep every 30 s while there are pending orders
  useEffect(() => {
    if (soundTimerRef.current) clearInterval(soundTimerRef.current)
    if (pending.length > 0) {
      soundTimerRef.current = setInterval(beep, 30_000)
    }
    return () => { if (soundTimerRef.current) clearInterval(soundTimerRef.current) }
  }, [pending.length, beep])

  async function startCollecting(id: string) {
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      await api.patch(`/pharmacist/orders/${id}/collecting`)
      // Capture the order BEFORE removing it from pending (closure, not inside updater)
      const movedOrder = pending.find((o) => o.id === id)
      // Two separate setState calls — no side effects inside updaters (StrictMode safe)
      setPending((prev) => prev.filter((o) => o.id !== id))
      if (movedOrder) {
        setCollecting((prev) =>
          prev.some((o) => o.id === movedOrder.id)
            ? prev
            : [...prev, { ...movedOrder, status: 'PHARMACY_COLLECTING' }]
        )
      }
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  async function confirmOrder(id: string) {
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      await api.patch(`/pharmacist/orders/${id}/confirm`)
      setCollecting((prev) => prev.filter((o) => o.id !== id))
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  async function confirmReject() {
    if (!rejectId) return
    const id = rejectId
    const reason = rejectReason === 'Другое' ? rejectOther : rejectReason
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      await api.patch(`/pharmacist/orders/${id}/reject`, { reason })
      setPending((prev) => prev.filter((o) => o.id !== id))
      setRejectId(null)
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  function toggleItem(orderId: string, medicineId: string) {
    setChecked((prev) => {
      const set = new Set(prev[orderId] ?? [])
      if (set.has(medicineId)) set.delete(medicineId)
      else set.add(medicineId)
      return { ...prev, [orderId]: set }
    })
  }

  const isEmpty = pending.length === 0 && collecting.length === 0

  return (
    <div className="max-w-3xl space-y-8">

      {/* ── Header with create button ───────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Заказы</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-[#16a273] text-white text-sm font-semibold rounded-lg hover:bg-[#13916a] transition-colors"
        >
          + Создать заказ
        </button>
      </div>

      {/* ── Pending orders ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-900">Новые заказы</h2>
          {pending.length > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
              {pending.length}
            </span>
          )}
        </div>

        {pending.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Новых заказов нет</p>
        ) : (
          <div className="space-y-3">
            {pending.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border-2 border-orange-200 p-5 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">Заказ #{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <CountdownTimer from={order.createdAt} />
                </div>

                <p className="text-sm text-gray-500 mb-1">
                  Клиент: <span className="font-medium text-gray-800">{order.customer.name || order.customer.phone}</span>
                </p>
                {order.deliveryAddress && (
                  <p className="text-sm text-gray-500 mb-3">📍 {order.deliveryAddress}</p>
                )}

                <div className="space-y-1 mb-4 bg-gray-50 rounded-lg p-3">
                  {order.items.map((item) => (
                    <div key={item.medicineId} className="flex justify-between text-sm">
                      <span className="text-gray-700">{item.nameRu} {item.dosage} × {item.quantity}</span>
                      <span className="text-gray-500">{(item.unitPrice * item.quantity).toLocaleString()} сум</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-lg">{order.totalPrice.toLocaleString()} сум</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setRejectId(order.id); setRejectReason('Нет в наличии'); setRejectOther('') }}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Отклонить
                    </button>
                    <button
                      onClick={() => startCollecting(order.id)}
                      disabled={!!loading[order.id]}
                      className="px-5 py-2 rounded-lg bg-[#16a273] text-white text-sm font-semibold hover:bg-[#13916a] transition-colors disabled:opacity-50"
                    >
                      {loading[order.id] ? '...' : '✓ Принять'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Collecting orders ──────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <h2 className="text-base font-semibold text-gray-900">В сборке</h2>
          {collecting.length > 0 && (
            <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {collecting.length}
            </span>
          )}
        </div>

        {collecting.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">Нет заказов в сборке</p>
        ) : (
          <div className="space-y-3">
            {collecting.map((order) => {
              const checkedSet = checked[order.id] ?? new Set<string>()
              const allChecked = order.items.every((i) => checkedSet.has(i.medicineId))

              return (
                <div key={order.id} className="bg-white rounded-xl border border-blue-200 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">Заказ #{order.orderNumber}</span>
                      <StatusBadge status={order.status} />
                    </div>
                    <span className="text-sm text-gray-500">
                      {checkedSet.size}/{order.items.length} позиций
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">{order.customer.name || order.customer.phone}</p>

                  <div className="space-y-1 mb-4">
                    {order.items.map((item) => (
                      <label
                        key={item.medicineId}
                        className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={checkedSet.has(item.medicineId)}
                          onChange={() => toggleItem(order.id, item.medicineId)}
                          className="w-4 h-4 rounded accent-[#16a273]"
                        />
                        <span className={`text-sm flex-1 ${checkedSet.has(item.medicineId) ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                          {item.nameRu} {item.dosage} × {item.quantity}
                        </span>
                        <span className="text-sm text-gray-400">
                          {(item.unitPrice * item.quantity).toLocaleString()} сум
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900">{order.totalPrice.toLocaleString()} сум</span>
                    <button
                      onClick={() => confirmOrder(order.id)}
                      disabled={!allChecked || !!loading[order.id]}
                      className="px-5 py-2 rounded-lg bg-[#16a273] text-white text-sm font-semibold hover:bg-[#13916a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading[order.id] ? '...' : allChecked ? '✓ Готово к выдаче' : `Отметьте все (${order.items.length - checkedSet.size} осталось)`}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <div className="text-5xl mb-4">✓</div>
          <p className="text-lg font-medium">Всё спокойно</p>
          <p className="text-sm mt-1">Ожидаем новые заказы...</p>
        </div>
      )}

      {/* Reject modal */}
      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            api.get<Order[]>('/pharmacist/orders').then((r) => classifyOrders(r.data)).catch(() => {})
          }}
        />
      )}

      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-4">Причина отклонения</h2>
            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={rejectReason === r}
                    onChange={() => setRejectReason(r)}
                    className="accent-[#16a273]"
                  />
                  <span className="text-sm text-gray-700">{r}</span>
                </label>
              ))}
            </div>
            {rejectReason === 'Другое' && (
              <input
                type="text"
                value={rejectOther}
                onChange={(e) => setRejectOther(e.target.value)}
                placeholder="Укажите причину"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#16a273]"
              />
            )}
            <div className="flex gap-2">
              <button onClick={() => setRejectId(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">
                Отмена
              </button>
              <button onClick={confirmReject}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600">
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
