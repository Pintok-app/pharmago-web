import { fetchEventSource } from '@microsoft/fetch-event-source'
import { useEffect, useRef, useState } from 'react'
import { api, API_URL } from '../lib/api'
import { getAuth } from '../store/authStore'
import type { PharmacistOrder as Order } from '../types/order'
import { useSound } from './useSound'

// Re-export so callers can import the type from this module if needed
export type { PharmacistOrder as Order } from '../types/order'

export interface PharmacistOrdersHook {
  pending: Order[]
  collecting: Order[]
  /** true only during the initial data fetch */
  loading: boolean
  error: string | null
  /** per-order mutation loading — keyed by order id */
  actionLoading: Record<string, boolean>
  acceptOrder: (id: string) => Promise<void>
  rejectOrder: (id: string, reason: string) => Promise<void>
  startCollecting: (id: string) => Promise<void>
  confirmOrder: (id: string) => Promise<void>
  /** NOTE: task spec signature is (orderId, itemIndex, qty).
   *  This implementation uses itemId + medicineId to avoid a breaking change
   *  in the call-sites. Reconcile when the call-sites are ready to pass an index. */
  updateItemQty: (orderId: string, itemId: string, medicineId: string, quantity: number) => Promise<void>
  refetch: () => void
}

export function usePharmacistOrders(): PharmacistOrdersHook {
  const [pending, setPending] = useState<Order[]>([])
  const [collecting, setCollecting] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({})
  const beep = useSound()
  const soundTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  function classifyOrders(orders: Order[]) {
    setPending(orders.filter((o) => o.status === 'AWAITING_PHARMACY'))
    setCollecting(orders.filter((o) => o.status === 'PHARMACY_COLLECTING'))
  }

  function setActionLoad(id: string, val: boolean) {
    setActionLoading((l) => ({ ...l, [id]: val }))
  }

  function refetch() {
    api.get<Order[]>('/pharmacist/orders').then((r) => classifyOrders(r.data)).catch(() => {})
  }

  // ── Initial fetch + SSE subscription ────────────────────────────────────
  useEffect(() => {
    setLoading(true)
    api
      .get<Order[]>('/pharmacist/orders')
      .then((r) => classifyOrders(r.data))
      .catch(() => setError('Не удалось загрузить заказы'))
      .finally(() => setLoading(false))

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
                : [data.order, ...prev],
            )
            beep()
          }
        } catch {
          /* ignore malformed SSE frames */
        }
      },
      // Return undefined (not throw) so fetchEventSource retries automatically
      onerror() {
        return undefined
      },
    }).catch(() => {})

    return () => ctrl.abort()
  }, [beep])

  // ── 30-second beep while pending orders exist ────────────────────────────
  useEffect(() => {
    if (soundTimerRef.current) clearInterval(soundTimerRef.current)
    if (pending.length > 0) {
      soundTimerRef.current = setInterval(beep, 30_000)
    }
    return () => {
      if (soundTimerRef.current) clearInterval(soundTimerRef.current)
    }
  }, [pending.length, beep])

  // ── Mutations ────────────────────────────────────────────────────────────

  async function acceptOrder(id: string) {
    setActionLoad(id, true)
    try {
      await api.patch(`/pharmacist/orders/${id}/collecting`)
      // Capture the order BEFORE removing it from pending (closure, not inside updater)
      const movedOrder = pending.find((o) => o.id === id)
      // Two separate setState calls — StrictMode safe (no side effects inside updaters)
      setPending((prev) => prev.filter((o) => o.id !== id))
      if (movedOrder) {
        setCollecting((prev) =>
          prev.some((o) => o.id === movedOrder.id)
            ? prev
            : [...prev, { ...movedOrder, status: 'PHARMACY_COLLECTING' }],
        )
      }
    } finally {
      setActionLoad(id, false)
    }
  }

  // startCollecting is the same action as acceptOrder
  const startCollecting = acceptOrder

  async function rejectOrder(id: string, reason: string) {
    setActionLoad(id, true)
    try {
      await api.patch(`/pharmacist/orders/${id}/reject`, { reason })
      setPending((prev) => prev.filter((o) => o.id !== id))
    } finally {
      setActionLoad(id, false)
    }
  }

  async function confirmOrder(id: string) {
    setActionLoad(id, true)
    try {
      await api.patch(`/pharmacist/orders/${id}/confirm`)
      setCollecting((prev) => prev.filter((o) => o.id !== id))
    } finally {
      setActionLoad(id, false)
    }
  }

  async function updateItemQty(
    orderId: string,
    itemId: string,
    medicineId: string,
    quantity: number,
  ) {
    try {
      const updated = await api.patch(
        `/pharmacist/orders/${orderId}/items/${itemId}/qty`,
        { quantity },
      )
      setCollecting((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? {
                ...o,
                totalPrice: updated.data.totalPrice,
                items: o.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
              }
            : o,
        ),
      )
      // When quantity reaches 0 the caller (OrdersPage) is responsible for
      // removing the item from the local "checked" set, since that UI state
      // lives in the page component.
      void medicineId // acknowledged — used by caller for checked-state cleanup
    } catch {
      /* ignore */
    }
  }

  return {
    pending,
    collecting,
    loading,
    error,
    actionLoading,
    acceptOrder,
    rejectOrder,
    startCollecting,
    confirmOrder,
    updateItemQty,
    refetch,
  }
}
