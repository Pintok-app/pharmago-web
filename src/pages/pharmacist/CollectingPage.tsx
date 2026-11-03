import { useEffect, useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { api } from '../../lib/api'

interface OrderItem {
  id: string
  medicineId: string
  nameRu: string
  dosage: string
  quantity: number
  unitPrice: number
  packSize: number
}

interface Order {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  customer: { name: string | null; phone: string } | null
  anonymousName?: string | null
  anonymousPhone?: string | null
  items: OrderItem[]
}

function customerLabel(o: Order): string {
  if (o.customer) return o.customer.name || o.customer.phone
  return o.anonymousName || o.anonymousPhone || '📞 Телефонный заказ'
}

export function CollectingPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [checked, setChecked] = useState<Record<string, Set<string>>>({})
  const [qtys, setQtys] = useState<Record<string, Record<string, number>>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    api.get<Order[]>('/pharmacist/orders').then((r) => {
      const collecting = r.data.filter((o) => o.status === 'PHARMACY_COLLECTING')
      setOrders(collecting)
      // init qty state from current item quantities
      const initQtys: Record<string, Record<string, number>> = {}
      collecting.forEach(o => {
        initQtys[o.id] = {}
        o.items.forEach(i => { initQtys[o.id][i.id] = i.quantity })
      })
      setQtys(initQtys)
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

  async function changeQty(orderId: string, item: OrderItem, newQty: number) {
    if (newQty < 1) return
    setQtys(prev => ({ ...prev, [orderId]: { ...prev[orderId], [item.id]: newQty } }))
    try {
      await api.patch(`/pharmacist/orders/${orderId}/items/${item.id}/qty`, { quantity: newQty })
    } catch {
      // revert on error
      setQtys(prev => ({ ...prev, [orderId]: { ...prev[orderId], [item.id]: item.quantity } }))
    }
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
        const orderQtys = qtys[order.id] ?? {}

        return (
          <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Заказ #{order.orderNumber}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-500 mb-4">{customerLabel(order)}</p>

            <div className="space-y-2 mb-4">
              {order.items.map((item) => {
                const qty = orderQtys[item.id] ?? item.quantity
                const isChecked = checkedSet.has(item.medicineId)
                return (
                  <div key={item.medicineId} className={`flex items-center gap-3 p-2 rounded-lg ${isChecked ? 'bg-gray-50' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleItem(order.id, item.medicineId)}
                      className="w-4 h-4 rounded accent-[#16a273] flex-shrink-0"
                    />
                    <span className={`text-sm flex-1 ${isChecked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      {item.nameRu} {item.dosage}
                    </span>
                    {/* Qty editor */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => changeQty(order.id, item, qty - 1)}
                        className="w-6 h-6 rounded border border-gray-300 text-gray-600 text-sm flex items-center justify-center hover:bg-gray-100 disabled:opacity-40"
                        disabled={qty <= 1}
                      >−</button>
                      <span className="text-sm font-medium w-6 text-center">{qty}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(order.id, item, qty + 1)}
                        className="w-6 h-6 rounded border border-gray-300 text-gray-600 text-sm flex items-center justify-center hover:bg-gray-100"
                      >+</button>
                    </div>
                    <span className="text-sm text-gray-500 w-24 text-right">
                      {(item.unitPrice * qty).toLocaleString()} сум
                    </span>
                  </div>
                )
              })}
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
                {loading[order.id] ? '...' : 'Готово к выдаче'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
