import type { MealType } from '../types'

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

/** 本地时区 YYYY-MM-DD */
export function dateStr(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

export function todayStr(): string {
  return dateStr(new Date())
}

export function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
}

export function addDays(s: string, delta: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + delta)
  return dateStr(d)
}

/** 周一=0 … 周日=6 */
export function weekdayIdx(s: string): number {
  return (parseDate(s).getDay() + 6) % 7
}

const WEEK_CN = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] as const

export function weekdayCN(s: string): string {
  return WEEK_CN[weekdayIdx(s)] ?? ''
}

/** "8月29日 · 周六" */
export function fmtDateCN(s: string): string {
  const d = parseDate(s)
  return `${d.getMonth() + 1}月${d.getDate()}日 · ${weekdayCN(s)}`
}

export interface MonthMeta {
  year: number
  /** 1-12 */
  month: number
  days: number
  /** 周一起始的头部空格数 */
  pads: number
}

export function monthMeta(year: number, month: number): MonthMeta {
  const days = new Date(year, month, 0).getDate()
  const pads = weekdayIdx(`${year}-${pad2(month)}-01`)
  return { year, month, days, pads }
}

export function monthRangeStr(year: number, month: number): { start: string; end: string } {
  const { days } = monthMeta(year, month)
  return { start: `${year}-${pad2(month)}-01`, end: `${year}-${pad2(month)}-${pad2(days)}` }
}

/** 按当前时段推断餐次 */
export function mealNow(d: Date = new Date()): MealType {
  const h = d.getHours()
  if (h >= 5 && h < 11) return 'breakfast'
  if (h >= 11 && h < 16) return 'lunch'
  if (h >= 16 && h < 21) return 'dinner'
  return 'snack'
}

export function fmtTime(ts: number): string {
  const d = new Date(ts)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}
