import { Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StreakBadgeProps {
  count: number
  className?: string
}

export function StreakBadge({ count, className }: StreakBadgeProps) {
  const color =
    count >= 30
      ? 'text-purple-500'
      : count >= 14
      ? 'text-red-500'
      : count >= 7
      ? 'text-orange-500'
      : count >= 3
      ? 'text-yellow-500'
      : 'text-gray-400'

  return (
    <span className={cn('flex items-center gap-0.5 font-bold', color, className)}>
      <Flame className="w-4 h-4" />
      {count}
    </span>
  )
}
