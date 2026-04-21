import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StreakBadge } from '@/components/streaks/StreakBadge'
import type { Meal } from '@/lib/types'
import { differenceInCalendarDays, parseISO } from 'date-fns'

interface StatsCardProps {
  name: string
  meals: Meal[]
  streak: { currentStreak: number; longestStreak: number } | null
  startDate: string
  endDate: string
}

export function StatsCard({ name, meals, streak, startDate, endDate }: StatsCardProps) {
  const totalDays = differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) + 1
  const today = new Date()
  const daysElapsed = Math.min(
    differenceInCalendarDays(today, parseISO(startDate)) + 1,
    totalDays
  )
  const daysRemaining = Math.max(totalDays - daysElapsed, 0)

  const totalMeals = meals.length
  const compliantMeals = meals.filter((m) => m.isCompliant).length
  const compliance = totalMeals > 0 ? Math.round((compliantMeals / totalMeals) * 100) : 0

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center justify-between">
          {name}
          <StreakBadge count={streak?.currentStreak ?? 0} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-orange-500">{compliance}%</p>
            <p className="text-xs text-gray-500">Compliance</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{streak?.longestStreak ?? 0}</p>
            <p className="text-xs text-gray-500">Best streak</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{totalMeals}</p>
            <p className="text-xs text-gray-500">Meals logged</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-800">{daysRemaining}</p>
            <p className="text-xs text-gray-500">Days left</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
