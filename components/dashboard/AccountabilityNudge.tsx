import { AlertCircle } from 'lucide-react'
import type { Meal } from '@/lib/types'

interface AccountabilityNudgeProps {
  partnerName: string
  partnerMeals: Meal[]
}

export function AccountabilityNudge({ partnerName, partnerMeals }: AccountabilityNudgeProps) {
  const now = Date.now()
  const lastMeal = partnerMeals.at(-1)
  const lastLoggedMs = lastMeal ? new Date(lastMeal.createdAt).getTime() : 0
  const hoursSinceLastLog = (now - lastLoggedMs) / (1000 * 60 * 60)

  if (hoursSinceLastLog < 3) return null

  const timeText = lastMeal
    ? `${Math.floor(hoursSinceLastLog)}h ago`
    : 'not yet today'

  return (
    <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>
        <span className="font-semibold">{partnerName}</span> last logged{' '}
        <span className="font-semibold">{timeText}</span> 👀 Send them a text!
      </span>
    </div>
  )
}
