import type { Meal } from './types'
import { addCalendarDays, easternDateString, eachChallengeDayYmd } from './easternTime'

export interface ComputedStreak {
  currentStreak: number
  longestStreak: number
}

/**
 * Compute compliance streaks directly from meals so the badge always matches
 * the calendar. A "compliant day" = at least one meal logged AND every logged
 * meal is marked compliant. Empty or mixed days break the run.
 *
 * Current streak: walk backwards from today. If today has no meals yet, start
 * from yesterday so in-progress days don't reset a valid streak.
 */
export function computeMealStreaks(
  meals: Meal[],
  startDate: string,
  endDate: string,
  today: string = easternDateString()
): ComputedStreak {
  const mealsByDate: Record<string, Meal[]> = {}
  for (const meal of meals) {
    if (!mealsByDate[meal.date]) mealsByDate[meal.date] = []
    mealsByDate[meal.date].push(meal)
  }

  const dayStatus = (date: string): 'compliant' | 'broke' | 'empty' => {
    const dayMeals = mealsByDate[date]
    if (!dayMeals || dayMeals.length === 0) return 'empty'
    return dayMeals.every((m) => m.isCompliant) ? 'compliant' : 'broke'
  }

  const walkableEnd = today < endDate ? today : endDate
  if (walkableEnd < startDate) return { currentStreak: 0, longestStreak: 0 }

  const days = eachChallengeDayYmd(startDate, walkableEnd)

  let longest = 0
  let run = 0
  for (const d of days) {
    if (dayStatus(d) === 'compliant') {
      run++
      if (run > longest) longest = run
    } else {
      run = 0
    }
  }

  // Walk backwards for current. Skip today only if today has no meals yet
  // (don't let an in-progress day zero a valid streak). Broken today still breaks it.
  let cursor = walkableEnd
  if (cursor === today && dayStatus(cursor) === 'empty') {
    cursor = addCalendarDays(cursor, -1)
  }
  let current = 0
  while (cursor >= startDate && dayStatus(cursor) === 'compliant') {
    current++
    cursor = addCalendarDays(cursor, -1)
  }

  return { currentStreak: current, longestStreak: longest }
}
