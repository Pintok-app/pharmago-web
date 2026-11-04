import { useState } from 'react'

const REJECT_REASONS = [
  'Нет в наличии',
  'Истёк срок годности',
  'Рецептурный препарат',
  'Другое',
]

interface Props {
  orderId: string
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}

export function RejectOrderModal({ orderId: _orderId, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('Нет в наличии')
  const [other, setOther] = useState('')

  async function handleConfirm() {
    await onConfirm(reason === 'Другое' ? other : reason)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <h2 className="font-semibold text-gray-900 mb-4">Причина отклонения</h2>
        <div className="space-y-2 mb-4">
          {REJECT_REASONS.map((r) => (
            <label
              key={r}
              className="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="accent-[#16a273]"
              />
              <span className="text-sm text-gray-700">{r}</span>
            </label>
          ))}
        </div>
        {reason === 'Другое' && (
          <input
            type="text"
            value={other}
            onChange={(e) => setOther(e.target.value)}
            placeholder="Укажите причину"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#16a273]"
          />
        )}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
          >
            Отмена
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-600"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  )
}
