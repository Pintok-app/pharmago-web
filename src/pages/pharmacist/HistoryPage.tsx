import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { ErrorBanner } from '../../components/ErrorBanner'
import { StatusBadge } from '../../components/StatusBadge'
import { api } from '../../lib/api'

interface Order {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  customer: { name: string | null; phone: string } | null
  anonymousName?: string | null
  anonymousPhone?: string | null
  items: Array<{ nameRu: string; quantity: number }>
  createdAt: string
  deliveredAt: string | null
}

function customerLabel(o: Order): string {
  if (o.customer) return o.customer.name || o.customer.phone
  return o.anonymousName || o.anonymousPhone || '📞 Телефонный заказ'
}

export function PharmacistHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    api.get<Order[]>('/pharmacist/orders/history')
      .then((r) => setOrders(r.data))
      .catch(() => setError('Не удалось загрузить историю заказов'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="py-12 text-center text-gray-400">Загрузка...</div>

  if (error) return <ErrorBanner message={error} />

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400">
        <p className="text-lg font-medium">История пуста</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">История заказов</h1>
      {/* TODO: add pagination when history grows */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Заказ</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Состав</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Сумма</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">#{order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{customerLabel(order)}</td>
                <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                  {order.items.map((i) => `${i.nameRu} ×${i.quantity}`).join(', ')}
                </td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">
                  {order.totalPrice.toLocaleString()}
                </td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                  {format(new Date(order.createdAt), 'dd.MM HH:mm')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
