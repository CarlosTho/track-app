export const MELON_WORD = 'melon'
export const MELON_THEME_KEY = 'trackpair.melonThemeUnlocked'
export const MELON_THEME_EVENT = 'trackpair:melon-theme-change'
export const MELON_COLOR = '#F6556F'

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

export function isMelonThemeUnlocked(): boolean {
  if (!isBrowser()) return false
  return localStorage.getItem(MELON_THEME_KEY) === '1'
}

export function applyMelonTheme(enabled: boolean): void {
  if (!isBrowser()) return
  document.documentElement.classList.toggle('melon-theme', enabled)
}

export function setMelonThemeUnlocked(enabled: boolean): void {
  if (!isBrowser()) return
  if (enabled) localStorage.setItem(MELON_THEME_KEY, '1')
  else localStorage.removeItem(MELON_THEME_KEY)
  applyMelonTheme(enabled)
  window.dispatchEvent(new CustomEvent(MELON_THEME_EVENT, { detail: { enabled } }))
}
