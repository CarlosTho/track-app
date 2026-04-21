import type { MealType } from '@/lib/types'
import { cn } from '@/lib/utils'
import { Coffee, Sun, Sunset, Apple } from 'lucide-react'

const MEAL_TYPES: { value: MealType; label: string; icon: React.ReactNode }[] = [
  { value: 'breakfast', label: 'Breakfast', icon: <Coffee className="w-5 h-5" /> },
  { value: 'lunch', label: 'Lunch', icon: <Sun className="w-5 h-5" /> },
  { value: 'dinner', label: 'Dinner', icon: <Sunset className="w-5 h-5" /> },
  { value: 'snack', label: 'Snack', icon: <Apple className="w-5 h-5" /> },
]

interface MealTypeSelectorProps {
  value: MealType
  onChange: (value: MealType) => void
}

export function MealTypeSelector({ value, onChange }: MealTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Meal Type</label>
      <div className="grid grid-cols-4 gap-2">
        {MEAL_TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => onChange(type.value)}
            className={cn(
              'flex flex-col items-center gap-1 py-3 rounded-lg border-2 text-xs font-medium transition-all',
              value === type.value
                ? 'border-orange-500 bg-orange-50 text-orange-700'
                : 'border-gray-200 text-gray-500 hover:border-orange-300'
            )}
          >
            {type.icon}
            {type.label}
          </button>
        ))}
      </div>
    </div>
  )
}
