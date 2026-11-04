export type OrderStatus =
  | 'CREATED'
  | 'AWAITING_PHARMACY'
  | 'PHARMACY_COLLECTING'
  | 'PHARMACY_CONFIRMED'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_AT_PHARMACY'
  | 'PICKED_UP'
  | 'DRIVER_EN_ROUTE'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'PHARMACY_REJECTED'
  | 'PHARMACY_TIMEOUT'
  | 'CANCELLED'
  | 'RETURNED'

export interface Order {
  id: string
  orderNumber: number
  status: OrderStatus
  totalPrice: number
  createdAt: string
  customer: { id: string; name: string | null; phone: string | null } | null
  anonymousName: string | null
  anonymousPhone: string | null
  address: string
  pharmacyName: string
  pharmacyAddress: string
  items: Array<{ name: string; quantity: number; unitPrice: number }>
  driverName: string | null
  driverPhone: string | null
  eta: string | null
}

// ── Pharmacist-facing order shape (richer than the shared Order above) ──────
export interface PharmacistOrderItem {
  id: string
  medicineId: string
  nameRu: string
  dosage: string
  quantity: number
  unitPrice: number
}

export interface PharmacistOrder {
  id: string
  orderNumber: number
  status: string
  totalPrice: number
  deliveryAddress: string | null
  customer: { name: string; phone: string }
  items: PharmacistOrderItem[]
  createdAt: string
}

export function customerLabel(order: Order): string {
  if (order.customer?.name) return order.customer.name
  if (order.anonymousName) return order.anonymousName
  return 'Клиент'
}

export function customerPhone(order: Order): string | null {
  return order.customer?.phone ?? order.anonymousPhone ?? null
}
