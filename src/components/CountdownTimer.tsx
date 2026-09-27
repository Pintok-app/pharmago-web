import { useEffect, useState } from 'react'

interface Props {
  from: string
  durationMs?: number
}

export function CountdownTimer({ from, durationMs = 5 * 60 * 1000 }: Props) {
  const deadline = new Date(from).getTime() + durationMs
  const [remaining, setRemaining] = useState(deadline - Date.now())

  useEffect(() => {
    const t = setInterval(() => setRemaining(deadline - Date.now()), 1000)
    return () => clearInterval(t)
  }, [deadline])

  if (remaining <= 0) {
    return <span className="font-mono text-sm font-semibold text-red-600">00:00</span>
  }

  const mins = Math.floor(remaining / 60_000)
  const secs = Math.floor((remaining % 60_000) / 1000)
  const urgent = remaining < 60_000

  return (
    <span className={`font-mono text-sm font-semibold ${urgent ? 'text-red-600 animate-pulse' : 'text-orange-500'}`}>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </span>
  )
}
