interface Props {
  message: string | null
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: Props) {
  if (!message) return null
  return (
    <div className="flex items-center justify-between gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
      <span>{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex-shrink-0 text-xs font-medium underline hover:no-underline"
        >
          Повторить
        </button>
      )}
    </div>
  )
}
