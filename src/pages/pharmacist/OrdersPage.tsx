import { useState } from 'react'
import { CountdownTimer } from '../../components/CountdownTimer'
import { ErrorBanner } from '../../components/ErrorBanner'
import { StatusBadge } from '../../components/StatusBadge'
import { usePharmacistOrders } from '../../hooks/usePharmacistOrders'
import { CreateOrderModal } from './CreateOrderModal'
import { RejectOrderModal } from './RejectOrderModal'

export function OrdersPage() {
  const {
    pending,
    collecting,
    loading,
    error,
    actionLoading,
    rejectOrder,
    startCollecting,
    confirmOrder,
    updateItemQty,
    refetch,
  } = usePharmacistOrders()

  const [checked, setChecked] = useState<Record<string, Set<string>>>({})
  const [rejectId, setRejectId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  function toggleItem(orderId: string, medicineId: string) {
    setChecked((prev) => {
      const set = new Set(prev[orderId] ?? [])
      if (set.has(medicineId)) set.delete(medicineId)
      else set.add(medicineId)
      return { ...prev, [orderId]: set }
    })
  }

  async function handleUpdateItemQty(
    orderId: string,
    itemId: string,
    medicineId: string,
    quantity: number,
  ) {
    await updateItemQty(orderId, itemId, medicineId, quantity)
    // Uncheck zeroed-out items (checked state lives here, not in the hook)
    if (quantity === 0) {
      setChecked((prev) => {
        const set = new Set(prev[orderId] ?? [])
        set.delete(medicineId)
        return { ...prev, [orderId]: set }
      })
    }
  }

  const isEmpty = pending.length === 0 && collecting.length === 0

  if (loading) {
    return <div className="py-16 text-center text-sm text-gray-400">Загрузка заказов...</div>
  }

  return (
    <div className="space-y-8">

      {/* ── Header with create button ───────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Заказы</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="hidden sm:flex px-4 py-2 bg-[#16a273] text-white text-sm font-semibold rounded-lg hover:bg-[#13916a] transition-colors"
        >
          + Создать заказ
        </button>
      </div>

      <ErrorBanner message={error} onRetry={refetch} />

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
                  Клиент:{' '}
                  <span className="font-medium text-gray-800">
                    {order.customer.name || order.customer.phone}
                  </span>
                </p>
                {order.deliveryAddress && (
                  <p className="text-sm text-gray-500 mb-3">📍 {order.deliveryAddress}</p>
                )}

                <div className="space-y-1 mb-4 bg-gray-50 rounded-lg p-3">
                  {order.items.map((item) => (
                    <div key={item.medicineId} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.nameRu} {item.dosage} × {item.quantity}
                      </span>
                      <span className="text-gray-500">
                        {(item.unitPrice * item.quantity).toLocaleString()} сум
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="font-bold text-gray-900 text-lg">
                    {order.totalPrice.toLocaleString()} сум
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRejectId(order.id)}
                      className="px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      Отклонить
                    </button>
                    <button
                      onClick={() => startCollecting(order.id)}
                      disabled={!!actionLoading[order.id]}
                      className="px-5 py-2 rounded-lg bg-[#16a273] text-white text-sm font-semibold hover:bg-[#13916a] transition-colors disabled:opacity-50"
                    >
                      {actionLoading[order.id] ? '...' : '✓ Принять'}
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
              const activeItems = order.items.filter((i) => i.quantity > 0)
              const allChecked =
                activeItems.length > 0 && activeItems.every((i) => checkedSet.has(i.medicineId))

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

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-gray-600">{order.customer.name || 'Клиент'}</p>
                    {order.customer.phone && (
                      <a
                        href={`tel:${order.customer.phone}`}
                        className="flex items-center gap-1.5 text-sm text-[#16a273] font-medium bg-[#dcf8ea] px-3 py-1 rounded-lg"
                      >
                        📞 {order.customer.phone}
                      </a>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-2 rounded-lg ${
                          checkedSet.has(item.medicineId) ? 'bg-gray-50' : 'bg-white border border-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedSet.has(item.medicineId)}
                          onChange={() => toggleItem(order.id, item.medicineId)}
                          className="w-4 h-4 rounded accent-[#16a273] shrink-0"
                        />
                        <span
                          className={`text-sm flex-1 ${
                            checkedSet.has(item.medicineId)
                              ? 'line-through text-gray-400'
                              : 'text-gray-700'
                          }`}
                        >
                          {item.nameRu} {item.dosage}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() =>
                              handleUpdateItemQty(
                                order.id,
                                item.id,
                                item.medicineId,
                                Math.max(0, item.quantity - 1),
                              )
                            }
                            className="w-6 h-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs"
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <button
                            onClick={() =>
                              handleUpdateItemQty(
                                order.id,
                                item.id,
                                item.medicineId,
                                item.quantity + 1,
                              )
                            }
                            className="w-6 h-6 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 flex items-center justify-center text-xs"
                          >
                            +
                          </button>
                        </div>
                        <span className="text-sm text-gray-400 w-24 text-right shrink-0">
                          {(item.unitPrice * item.quantity).toLocaleString()} сум
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-bold text-gray-900">
                      {order.totalPrice.toLocaleString()} сум
                    </span>
                    <button
                      onClick={() => confirmOrder(order.id)}
                      disabled={!allChecked || !!actionLoading[order.id]}
                      className="px-5 py-2 rounded-lg bg-[#16a273] text-white text-sm font-semibold hover:bg-[#13916a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {actionLoading[order.id]
                        ? '...'
                        : allChecked
                          ? '✓ Готово к выдаче'
                          : `Отметьте все (${order.items.length - checkedSet.size} осталось)`}
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

      {showCreate && (
        <CreateOrderModal
          onClose={() => setShowCreate(false)}
          onCreated={() => refetch()}
        />
      )}

      {rejectId && (
        <RejectOrderModal
          orderId={rejectId}
          onClose={() => setRejectId(null)}
          onConfirm={async (reason) => {
            await rejectOrder(rejectId, reason)
            setRejectId(null)
          }}
        />
      )}
    </div>
  )
}
