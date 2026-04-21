import { useState } from 'react'
import { CheckCircle2, XCircle, Coffee, Sun, Sunset, Apple, Trash2 } from 'lucide-react'
import type { Meal, MealType } from '@/lib/types'
import { format, parseISO } from 'date-fns'
import { deleteMeal } from '@/lib/firestore/meals'
import { toast } from 'sonner'

const mealIcons: Record<MealType, React.ReactNode> = {
  breakfast: <Coffee className="w-4 h-4 text-amber-500" />,
  lunch: <Sun className="w-4 h-4 text-yellow-500" />,
  dinner: <Sunset className="w-4 h-4 text-orange-500" />,
  snack: <Apple className="w-4 h-4 text-green-500" />,
}

interface MealCardProps {
  meal: Meal
  isCurrentUser?: boolean
}

export function MealCard({ meal, isCurrentUser }: MealCardProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Delete this meal?')) return
    setDeleting(true)
    try {
      await deleteMeal(meal.id)
      toast.success('Meal deleted')
    } catch (err) {
      console.error('deleteMeal error:', err)
      toast.error('Failed to delete meal')
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
      <div className="mt-0.5">{mealIcons[meal.mealType]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 capitalize">{meal.mealType}</p>
        <p className="text-sm text-gray-600 truncate">{meal.description}</p>
        {meal.notes && <p className="text-xs text-gray-400 mt-0.5">{meal.notes}</p>}
        <p className="text-xs text-gray-400 mt-1">
          {format(parseISO(meal.createdAt), 'h:mm a')}
        </p>
      </div>
      <div className="flex items-center gap-2 mt-0.5">
        {meal.isCompliant ? (
          <CheckCircle2 className="w-5 h-5 text-green-500" />
        ) : (
          <XCircle className="w-5 h-5 text-red-500" />
        )}
        {isCurrentUser && (
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-gray-300 hover:text-red-400 transition-colors disabled:opacity-50"
            aria-label="Delete meal"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
