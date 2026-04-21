'use client'

import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Sparkles } from 'lucide-react'
import {
  MELON_WORD,
  MELON_THEME_EVENT,
  MELON_THEME_KEY,
  isMelonThemeUnlocked,
  setMelonThemeUnlocked,
} from '@/lib/melonTheme'

export function SecretChallenge() {
  const [value, setValue] = useState('')
  const [tries, setTries] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const sync = () => setUnlocked(isMelonThemeUnlocked())
    sync()

    const onStorage = (e: StorageEvent) => {
      if (e.key === MELON_THEME_KEY) sync()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(MELON_THEME_EVENT, sync)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(MELON_THEME_EVENT, sync)
    }
  }, [])

  const handleGuess = (e: React.FormEvent) => {
    e.preventDefault()
    if (unlocked) return
    setTries((t) => t + 1)
    if (value.trim().toLowerCase() === MELON_WORD) {
      setMelonThemeUnlocked(true)
      setUnlocked(true)
      setShowConfetti(true)
      setTimeout(() => setShowConfetti(false), 2200)
    }
  }

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 mb-6 relative overflow-hidden">
      {showConfetti && (
        <div className="pointer-events-none fixed inset-0 z-[90]" aria-hidden>
          {Array.from({ length: 42 }).map((_, i) => (
            <span
              key={i}
              className="tp-confetti-piece"
              style={{
                left: `${(i * 2.41) % 100}%`,
                backgroundColor: ['#F6556F', '#fb923c', '#facc15', '#34d399', '#60a5fa'][i % 5],
                animationDelay: `${(i % 14) * 0.06}s`,
                animationDuration: `${1.4 + (i % 6) * 0.18}s`,
                transform: `rotate(${(i * 37) % 360}deg)`,
              }}
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-orange-500" />
        <h3 className="font-semibold text-gray-900">Guess the word</h3>
      </div>
      <p className="text-sm text-gray-500 mb-4">(for a surprise)</p>

      {unlocked ? (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm font-medium text-pink-600 bg-pink-50 border border-pink-200 rounded-xl px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            You got it mi amor ❤️
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-pink-300 text-pink-600 hover:bg-pink-100"
            onClick={() => {
              setMelonThemeUnlocked(false)
              setUnlocked(false)
              setValue('')
            }}
          >
            Change it back
          </Button>
        </div>
      ) : (
        <form onSubmit={handleGuess} className="flex flex-col sm:flex-row gap-2">
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Type your guess"
            className="sm:max-w-xs"
          />
          <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
            Try
          </Button>
          <span className="text-xs text-gray-400 self-center">Unlimited tries {tries > 0 ? `· ${tries}` : ''}</span>
        </form>
      )}
    </div>
  )
}
