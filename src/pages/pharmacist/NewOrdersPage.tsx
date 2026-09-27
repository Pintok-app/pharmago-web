import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useRef, useState } from 'react'
import { CountdownTimer } from '../../components/CountdownTimer'
import { StatusBadge } from '../../components/StatusBadge'
import { useSound } from '../../hooks/useSound'
import { api, API_URL } from '../../lib/api'
import { getAuth } from '../../store/authStore'

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

export function NewOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('Нет в наличии')
  const [rejectOther, setRejectOther] = useState('')
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const beep = useSound()
  const soundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    api.get<Order[]>('/pharmacist/orders').then((r) => {
      setOrders(r.data.filter((o) => o.status === 'AWAITING_PHARMACY'))
    }).catch(() => {})

    const token = getAuth().token
    const ctrl = new AbortController()

    fetchEventSource(`${API_URL}/pharmacist/orders/stream`, {
      headers: { Authorization: `Bearer ${token ?? ''}` },
      signal: ctrl.signal,
      onmessage(ev) {
        try {
          const data = JSON.parse(ev.data) as { type: string; order: Order }
          if (data.type === 'NEW_ORDER') {
            setOrders((prev) => [data.order, ...prev])
            beep()
          }
        } catch { /* ignore malformed event */ }
      },
      onerror(err) { throw err },
    }).catch(() => {})

    return () => ctrl.abort()
  }, [beep])

  useEffect(() => {
    if (soundTimerRef.current) clearInterval(soundTimerRef.current)
    if (orders.length > 0) {
      soundTimerRef.current = setInterval(beep, 30_000)
    }
    return () => { if (soundTimerRef.current) clearInterval(soundTimerRef.current) }
  }, [orders.length, beep])

  async function startCollecting(id: string) {
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      await api.patch(`/pharmacist/orders/${id}/collecting`)
      setOrders((prev) => prev.filter((o) => o.id !== id))
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
      setOrders((prev) => prev.filter((o) => o.id !== id))
      setRejectId(null)
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <div className="text-4xl mb-3">✓</div>
        <p className="text-lg font-medium">Новых заказов нет</p>
        <p className="text-sm mt-1">Ожидаем новые заказы...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-lg font-semibold text-gray-900">Новые заказы ({orders.length})</h1>

      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-900">Заказ #{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <CountdownTimer from={order.createdAt} />
          </div>

          <p className="text-sm text-gray-500 mb-1">
            Клиент: <span className="text-gray-700 font-medium">{order.customer.name || order.customer.phone}</span>
          </p>
          {order.deliveryAddress && (
            <p className="text-sm text-gray-500 mb-3">Адрес: {order.deliveryAddress}</p>
          )}

          <div className="space-y-1 mb-4">
            {order.items.map((item) => (
              <div key={item.medicineId} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.nameRu} {item.dosage} × {item.quantity}</span>
                <span className="text-gray-500">{(item.unitPrice * item.quantity).toLocaleString()} сум</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="font-semibold text-gray-900">{order.totalPrice.toLocaleString()} сум</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setRejectId(order.id); setRejectReason('Нет в наличии'); setRejectOther('') }}
                className="px-4 py-1.5 rounded-lg border border-red-200 text-red-600 text-sm hover:bg-red-50 transition-colors"
              >
                Отклонить
              </button>
              <button
                onClick={() => startCollecting(order.id)}
                disabled={loading[order.id]}
                className="px-4 py-1.5 rounded-lg bg-[#16a273] text-white text-sm font-medium hover:bg-[#13916a] transition-colors disabled:opacity-50"
              >
                {loading[order.id] ? '...' : 'Начать сборку'}
              </button>
            </div>
          </div>
        </div>
      ))}

      {rejectId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="font-semibold text-gray-900 mb-4">Причина отклонения</h2>
            <div className="space-y-2 mb-4">
              {REJECT_REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
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
              <button
                onClick={() => setRejectId(null)}
                className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
              >
                Отмена
              </button>
              <button
                onClick={confirmReject}
                className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
              >
                Отклонить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
