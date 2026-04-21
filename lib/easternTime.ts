import { formatInTimeZone } from 'date-fns-tz'

/** All challenge “calendar days” and meal `date` fields use Eastern Time (US). */
export const APP_TIMEZONE = 'America/New_York' as const

/** Today’s date as `yyyy-MM-dd` in Eastern — use for meal queries and logging. */
export function easternDateString(date: Date = new Date()): string {
  return formatInTimeZone(date, APP_TIMEZONE, 'yyyy-MM-dd')
}

/** Format any instant in Eastern (e.g. headers, labels). */
export function easternFormat(date: Date, fmt: string): string {
  return formatInTimeZone(date, APP_TIMEZONE, fmt)
}

/** Add days to a `yyyy-MM-dd` using UTC calendar math (noon anchor avoids DST edge cases). */
export function addCalendarDays(ymd: string, delta: number): string {
  const [y, mo, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, mo - 1, d + delta, 12, 0, 0))
  return dt.toISOString().slice(0, 10)
}

export function diffCalendarDays(laterYmd: string, earlierYmd: string): number {
  const [ly, lm, ld] = laterYmd.split('-').map(Number)
  const [ey, em, ed] = earlierYmd.split('-').map(Number)
  const a = Date.UTC(ly, lm - 1, ld)
  const b = Date.UTC(ey, em - 1, ed)
  return Math.round((a - b) / 86400000)
}

export function challengeDayProgress(
  startYmd: string,
  endYmd: string,
  now: Date = new Date()
): { currentDay: number; totalDays: number; todayYmd: string } {
  const todayYmd = easternDateString(now)
  const totalDays = diffCalendarDays(endYmd, startYmd) + 1
  let currentDay: number
  if (todayYmd < startYmd) currentDay = 1
  else if (todayYmd > endYmd) currentDay = totalDays
  else currentDay = diffCalendarDays(todayYmd, startYmd) + 1
  return {
    currentDay: Math.max(1, Math.min(totalDays, currentDay)),
    totalDays,
    todayYmd,
  }
}

/** Each calendar day in the challenge as `yyyy-MM-dd` (for progressive grid). */
export function eachChallengeDayYmd(startYmd: string, endYmd: string): string[] {
  const n = diffCalendarDays(endYmd, startYmd) + 1
  return Array.from({ length: n }, (_, i) => addCalendarDays(startYmd, i))
}
