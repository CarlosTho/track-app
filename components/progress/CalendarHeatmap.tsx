'use client'

import { useMemo } from 'react'
import type { Meal } from '@/lib/types'
import { cn } from '@/lib/utils'
import { eachChallengeDayYmd, easternDateString } from '@/lib/easternTime'

interface CalendarHeatmapProps {
  meals: Meal[]
  startDate: string
  endDate: string
}

export function CalendarHeatmap({ meals, startDate, endDate }: CalendarHeatmapProps) {
  const today = easternDateString()

  const dayData = useMemo(() => {
    const mealsByDate: Record<string, Meal[]> = {}
    for (const meal of meals) {
      if (!mealsByDate[meal.date]) mealsByDate[meal.date] = []
      mealsByDate[meal.date].push(meal)
    }

    const days = eachChallengeDayYmd(startDate, endDate)

    return days.map((dateStr) => {
      const dayMeals = mealsByDate[dateStr] ?? []
      const isFuture = dateStr > today

      if (isFuture) return { date: dateStr, status: 'future' as const }
      if (dayMeals.length === 0) return { date: dateStr, status: 'empty' as const }
      const allCompliant = dayMeals.every((m) => m.isCompliant)
      return { date: dateStr, status: allCompliant ? 'compliant' : ('broke' as const) }
    })
  }, [meals, startDate, endDate, today])

  const colorMap: Record<string, string> = {
    compliant: 'bg-green-500',
    broke: 'bg-red-400',
    empty: 'bg-gray-200',
    future: 'bg-gray-100',
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {dayData.map(({ date, status }) => (
          <div
            key={date}
            title={date}
            className={cn('w-8 h-8 rounded-md', colorMap[status])}
          />
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded" />Compliant</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" />Broke rule</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 bg-gray-200 rounded" />No logs</span>
      </div>
    </div>
  )
}
