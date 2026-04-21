'use client'

import Link from 'next/link'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { MealCard } from './MealCard'
import { DailyComplianceSummary } from './DailyComplianceSummary'
import { StreakBadge } from '@/components/streaks/StreakBadge'
import type { Meal } from '@/lib/types'
import { Plus } from 'lucide-react'

interface UserColumnProps {
  name: string
  photoUrl?: string
  meals: Meal[]
  streakCount: number
  isCurrentUser: boolean
}

export function UserColumn({ name, photoUrl, meals, streakCount, isCurrentUser }: UserColumnProps) {
  const initial = (name?.trim() || '?')[0]?.toUpperCase() ?? '?'
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={photoUrl ?? ''} />
            <AvatarFallback className="bg-orange-100 text-orange-600">
              {initial}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900">{isCurrentUser ? 'You' : name}</p>
            <p className="text-xs text-gray-500">{name}</p>
          </div>
        </div>
        <StreakBadge count={streakCount} />
      </div>

      <DailyComplianceSummary meals={meals} />

      <div className="space-y-2">
        {meals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm">No meals yet today</p>
          </div>
        ) : (
          meals.map((meal) => <MealCard key={meal.id} meal={meal} isCurrentUser={isCurrentUser} />)
        )}
      </div>

      {isCurrentUser && (
        <Link href="/log">
          <Button className="w-full bg-orange-500 hover:bg-orange-600" size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Log Meal
          </Button>
        </Link>
      )}
    </div>
  )
}
