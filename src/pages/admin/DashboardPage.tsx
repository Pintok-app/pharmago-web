import { format } from 'date-fns'
import { useCallback, useEffect, useState } from 'react'
import { StatusBadge } from '../../components/StatusBadge'
import { api } from '../../lib/api'

interface Stats {
  todayCount: number
  todayRevenue: number
  activeOrders: number
  onlineDrivers: number
  appOrdersToday: number
  phoneOrdersToday: number
}

interface Order {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  customer: { name: string; phone: string }
  pharmacy: { name: string }
  createdAt: string
}

interface OrdersResponse {
  data: Order[]
  total: number
  page: number
  limit: number
}

const STATUSES = [
  'AWAITING_PHARMACY', 'PHARMACY_COLLECTING', 'PHARMACY_CONFIRMED',
  'SEARCHING_DRIVER', 'DRIVER_ASSIGNED', 'DRIVER_AT_PHARMACY',
  'PICKED_UP', 'ARRIVED', 'COMPLETED', 'CANCELLED', 'RETURNED',
]

const PAGE_SIZE = 20

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [status, setStatus] = useState('')
  const [orderNumber, setOrderNumber] = useState('')
  const [useDateRange, setUseDateRange] = useState(false)

  const loadOrders = useCallback(() => {
    const params: Record<string, string> = { page: String(page), limit: String(PAGE_SIZE) }
    if (useDateRange) {
      if (dateFrom) params.dateFrom = dateFrom
      if (dateTo) params.dateTo = dateTo
    } else {
      params.date = date
    }
    if (status) params.status = status
    if (orderNumber) params.orderNumber = orderNumber

    api.get<OrdersResponse>('/admin/orders', { params })
      .then((r) => { setOrders(r.data.data); setTotal(r.data.total) })
      .catch(() => {})
  }, [page, date, dateFrom, dateTo, status, orderNumber, useDateRange])

  useEffect(() => {
    api.get<Stats>('/admin/stats').then((r) => setStats(r.data)).catch(() => {})
  }, [])

  useEffect(() => { loadOrders() }, [loadOrders])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Дашборд</h1>

      {stats && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Заказов сегодня',  value: stats.todayCount },
            { label: 'Выручка сегодня',  value: `${stats.todayRevenue.toLocaleString()} сум` },
            { label: 'Активные заказы',  value: stats.activeOrders },
            { label: 'Водителей онлайн', value: stats.onlineDrivers },
            { label: '📱 Через приложение', value: stats.appOrdersToday },
            { label: '📞 По звонку',        value: stats.phoneOrdersToday },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-sm text-gray-500">{s.label}</p>
              <p className="text-2xl font-semibold text-gray-900 mt-1">{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-end gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
            <input
              type="checkbox"
              checked={useDateRange}
              onChange={(e) => { setUseDateRange(e.target.checked); setPage(1) }}
              className="accent-[#16a273]"
            />
            Диапазон дат
          </label>

          {useDateRange ? (
            <>
              <div>
                <p className="text-xs text-gray-500 mb-1">С</p>
                <input type="date" value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1) }}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1">По</p>
                <input type="date" value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); setPage(1) }}
                  className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
              </div>
            </>
          ) : (
            <div>
              <p className="text-xs text-gray-500 mb-1">Дата</p>
              <input type="date" value={date}
                onChange={(e) => { setDate(e.target.value); setPage(1) }}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
            </div>
          )}

          <div>
            <p className="text-xs text-gray-500 mb-1">Статус</p>
            <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#16a273]">
              <option value="">Все статусы</option>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <p className="text-xs text-gray-500 mb-1">Номер заказа</p>
            <input type="text" value={orderNumber} placeholder="Поиск"
              onChange={(e) => { setOrderNumber(e.target.value); setPage(1) }}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm w-32 focus:outline-none focus:ring-2 focus:ring-[#16a273]" />
          </div>

          <button onClick={loadOrders}
            className="px-4 py-1.5 bg-[#16a273] text-white rounded-lg text-sm font-medium hover:bg-[#13916a] transition-colors">
            Найти
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-500">№</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Клиент</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Аптека</th>
              <th className="text-right px-4 py-3 font-medium text-gray-500">Сумма</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Статус</th>
              <th className="text-left px-4 py-3 font-medium text-gray-500">Дата</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Заказов не найдено</td></tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">#{order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600">{order.customer.name || order.customer.phone}</td>
                <td className="px-4 py-3 text-gray-600">{order.pharmacy.name}</td>
                <td className="px-4 py-3 text-right font-medium text-gray-900">{order.totalPrice.toLocaleString()}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3 text-gray-500">{format(new Date(order.createdAt), 'dd.MM HH:mm')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <span className="text-sm text-gray-500">Всего: {total}</span>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)}
                  className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                    page === p ? 'bg-[#16a273] text-white' : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
