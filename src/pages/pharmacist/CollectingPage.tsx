import { useEffect, useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { api } from '../../lib/api'

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
  customer: { name: string; phone: string }
  items: OrderItem[]
}

export function CollectingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [checked, setChecked] = useState<Record<string, Set<string>>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get<Order[]>('/pharmacist/orders').then((r) => {
      setOrders(r.data.filter((o) => o.status === 'PHARMACY_COLLECTING'))
    }).catch(() => {})
  }, [])

  function toggleItem(orderId: string, medicineId: string) {
    setChecked((prev) => {
      const set = new Set(prev[orderId] ?? [])
      if (set.has(medicineId)) set.delete(medicineId)
      else set.add(medicineId)
      return { ...prev, [orderId]: set }
    })
  }

  async function confirmOrder(id: string) {
    setLoading((l) => ({ ...l, [id]: true }))
    try {
      await api.patch(`/pharmacist/orders/${id}/confirm`)
      setOrders((prev) => prev.filter((o) => o.id !== id))
    } finally {
      setLoading((l) => ({ ...l, [id]: false }))
    }
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-medium">Нет заказов в сборке</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-lg font-semibold text-gray-900">Сборка заказов ({orders.length})</h1>

      {orders.map((order) => {
        const checkedSet = checked[order.id] ?? new Set<string>()
        const allChecked = order.items.every((i) => checkedSet.has(i.medicineId))

        return (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Заказ #{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-500 mb-4">{order.customer.name || order.customer.phone}</p>

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
                  <span className="text-sm text-gray-500">
                    {(item.unitPrice * item.quantity).toLocaleString()} сум
                  </span>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                {checkedSet.size}/{order.items.length} позиций
              </span>
              <button
                onClick={() => confirmOrder(order.id)}
                disabled={!allChecked || !!loading[order.id]}
                className="px-5 py-1.5 rounded-lg bg-[#16a273] text-white text-sm font-medium hover:bg-[#13916a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading[order.id] ? '...' : 'Готово'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
