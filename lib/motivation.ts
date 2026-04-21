export interface MotivationMessage {
  emoji: string
  title: string
  subtitle: string
  color: string
}

export function getMotivationalMessage(
  currentDay: number,
  totalDays: number,
  compliance: number
): MotivationMessage {
  const pct = currentDay / totalDays

  if (currentDay === 1) return {
    emoji: '🚀',
    title: "Day 1 — Let's go!",
    subtitle: "Every journey starts with a single step. You've got this.",
    color: 'from-blue-500 to-indigo-500',
  }
  if (pct <= 0.2) return {
    emoji: '💪',
    title: 'Just getting started!',
    subtitle: `${totalDays - currentDay} days left. Build that habit one meal at a time.`,
    color: 'from-blue-500 to-indigo-500',
  }
  if (pct < 0.5) return {
    emoji: '🔥',
    title: 'Building momentum!',
    subtitle: `You're ${currentDay} days in. Keep the streak alive.`,
    color: 'from-orange-400 to-pink-500',
  }
  if (pct === 0.5) return {
    emoji: '⚡',
    title: 'Halfway there!',
    subtitle: "You're at the midpoint. The hardest part is behind you.",
    color: 'from-purple-500 to-pink-500',
  }
  if (pct < 0.8) return {
    emoji: '🎯',
    title: 'More than halfway done!',
    subtitle: `Only ${totalDays - currentDay} days left. Don't let up now.`,
    color: 'from-purple-500 to-orange-400',
  }
  if (currentDay < totalDays) return {
    emoji: '🏁',
    title: 'Almost there!',
    subtitle: `${totalDays - currentDay} day${totalDays - currentDay === 1 ? '' : 's'} to go. Finish strong — you're so close.`,
    color: 'from-green-500 to-emerald-400',
  }
  // Last day
  return {
    emoji: '🌟',
    title: 'Final day!',
    subtitle: compliance >= 80
      ? "You've been crushing it. End on a high note!"
      : 'Make today count — finish strong!',
    color: 'from-yellow-400 to-orange-500',
  }
}
