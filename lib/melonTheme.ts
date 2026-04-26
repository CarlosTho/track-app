export const MELON_WORD = 'bebeshita'
export const MELON_COLOR = '#F6556F'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function applyMelonTheme(enabled: boolean): void {
  if (!isBrowser()) return
  document.documentElement.classList.toggle('melon-theme', enabled)
}
