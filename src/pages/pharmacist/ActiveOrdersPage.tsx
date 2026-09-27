import { useEffect, useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { api } from '../../lib/api'

const ACTIVE_STATUSES = new Set([
  'PHARMACY_CONFIRMED',
  'SEARCHING_DRIVER',
  'DRIVER_ASSIGNED',
  'DRIVER_AT_PHARMACY',
  'PICKED_UP',
  'ARRIVED',
])

interface Order {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  deliveryAddress: string | null
  customer: { name: string; phone: string }
  driver: { name: string; phone: string } | null
  items: Array<{ nameRu: string; quantity: number }>
}

export function ActiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  function load() {
    setLoading(true)
    api.get<Order[]>('/pharmacist/orders')
      .then((r) => setOrders(r.data.filter((o) => ACTIVE_STATUSES.has(o.status))))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  if (loading) return <div className="py-12 text-center text-gray-400">Загрузка...</div>

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-medium">Нет активных заказов</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Активные заказы ({orders.length})</h1>
        <button onClick={load} className="text-sm text-[#16a273] hover:underline">Обновить</button>
      </div>

      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-900">Заказ #{order.orderNumber}</span>
            <StatusBadge status={order.status} />
          </div>
          <div className="text-sm text-gray-500 space-y-0.5 mb-3">
            <p>Клиент: <span className="text-gray-700">{order.customer.name || order.customer.phone}</span></p>
            {order.driver && (
              <p>Водитель: <span className="text-gray-700">{order.driver.name} · {order.driver.phone}</span></p>
            )}
            {order.deliveryAddress && <p>Адрес: {order.deliveryAddress}</p>}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <span className="text-sm text-gray-500">
              {order.items.map((i) => `${i.nameRu} ×${i.quantity}`).join(', ')}
            </span>
            <span className="font-semibold text-gray-900">{order.totalPrice.toLocaleString()} сум</span>
          </div>
        </div>
      ))}
    </div>
  )
}
