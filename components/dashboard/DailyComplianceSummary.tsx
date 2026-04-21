import type { Meal } from '@/lib/types'

interface DailyComplianceSummaryProps {
  meals: Meal[]
}

export function DailyComplianceSummary({ meals }: DailyComplianceSummaryProps) {
  if (meals.length === 0) {
    return <p className="text-xs text-gray-400">No meals logged today</p>
  }

  const compliant = meals.filter((m) => m.isCompliant).length
  const total = meals.length
  const pct = Math.round((compliant / total) * 100)

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${pct === 100 ? 'bg-green-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {compliant}/{total} compliant
      </span>
    </div>
  )
}
