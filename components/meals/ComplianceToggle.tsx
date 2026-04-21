import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ComplianceToggleProps {
  value: boolean
  onChange: (value: boolean) => void
  flags?: string[]
}

export function ComplianceToggle({ value, onChange, flags }: ComplianceToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">Compliance</label>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all',
            value
              ? 'border-green-500 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-400 hover:border-green-300'
          )}
        >
          <CheckCircle2 className="w-5 h-5" />
          Compliant
        </button>
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition-all',
            !value
              ? 'border-red-500 bg-red-50 text-red-700'
              : 'border-gray-200 text-gray-400 hover:border-red-300'
          )}
        >
          <XCircle className="w-5 h-5" />
          Broke Rule
        </button>
      </div>
      {flags && flags.length > 0 && (
        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 space-y-1">
          <p className="font-medium">Smart suggestion flagged:</p>
          {flags.map((f, i) => (
            <p key={i}>• {f}</p>
          ))}
        </div>
      )}
    </div>
  )
}
