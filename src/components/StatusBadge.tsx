const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  AWAITING_PHARMACY:   { label: 'Ждёт фармацевта',    cls: 'bg-yellow-100 text-yellow-800' },
  PHARMACY_COLLECTING: { label: 'Собирается',          cls: 'bg-blue-100 text-blue-800' },
  PHARMACY_CONFIRMED:  { label: 'Готов',               cls: 'bg-green-100 text-green-800' },
  PHARMACY_REJECTED:   { label: 'Отклонён',            cls: 'bg-red-100 text-red-800' },
  PHARMACY_TIMEOUT:    { label: 'Таймаут',             cls: 'bg-red-100 text-red-800' },
  SEARCHING_DRIVER:    { label: 'Ищем водителя',       cls: 'bg-purple-100 text-purple-800' },
  DRIVER_ASSIGNED:     { label: 'Водитель назначен',   cls: 'bg-indigo-100 text-indigo-800' },
  DRIVER_AT_PHARMACY:  { label: 'Водитель в аптеке',   cls: 'bg-indigo-100 text-indigo-800' },
  PICKED_UP:           { label: 'Забрал',              cls: 'bg-blue-100 text-blue-800' },
  ARRIVED:             { label: 'Прибыл',              cls: 'bg-teal-100 text-teal-800' },
  DELIVERED:           { label: 'Доставлено',          cls: 'bg-green-100 text-green-800' },
  COMPLETED:           { label: 'Завершён',            cls: 'bg-gray-100 text-gray-600' },
  CANCELLED:           { label: 'Отменён',             cls: 'bg-red-100 text-red-800' },
  RETURNED:            { label: 'Возврат',             cls: 'bg-orange-100 text-orange-800' },
}

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  )
}
