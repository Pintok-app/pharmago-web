import { useEffect, useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { api } from '../../lib/api'

const HISTORY_STATUSES = new Set([
  'COMPLETED', 'CANCELLED', 'RETURNED', 'PHARMACY_REJECTED', 'PHARMACY_TIMEOUT',
])

interface Order {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  customer: { name: string; phone: string }
  items: Array<{ nameRu: string; quantity: number }>
  createdAt: string
}

export function PharmacistHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get<Order[]>('/pharmacist/orders')
      .then((r) => setOrders(r.data.filter((o) => HISTORY_STATUSES.has(o.status))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-12 text-center text-gray-400">Загрузка...</div>

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-medium">История пуста</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-4xl">
      <h1 className="text-lg font-semibold text-gray-900">История заказов</h1>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Заказ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Состав</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Сумма</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">#{order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{order.customer.name || order.customer.phone}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                  {order.items.map((i) => `${i.nameRu} ×${i.quantity}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {order.totalPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
