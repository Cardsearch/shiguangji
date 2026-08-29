import { addDays } from './date'
import { MEAL_ORDER, type FoodRecord, type MealType } from '../types'

export interface DaySummary {
  totalKcal: number
  count: number
  byMeal: Record<MealType, FoodRecord[]>
  kcalByMeal: Record<MealType, number>
}

export function emptyByMeal<T>(): Record<MealType, T[]> {
  return { breakfast: [], lunch: [], dinner: [], snack: [] }
}

export function summarizeDay(records: FoodRecord[]): DaySummary {
  const byMeal = emptyByMeal<FoodRecord>()
  for (const r of records) byMeal[r.mealType].push(r)
  const kcalByMeal: Record<MealType, number> = { breakfast: 0, lunch: 0, dinner: 0, snack: 0 }
  let totalKcal = 0
  for (const m of MEAL_ORDER) {
    byMeal[m].sort((a, b) => a.createdAt - b.createdAt)
    kcalByMeal[m] = byMeal[m].reduce((s, r) => s + r.kcal, 0)
    totalKcal += kcalByMeal[m]
  }
  return { totalKcal, count: records.length, byMeal, kcalByMeal }
}

/**
 * 连续打卡天数：以今天为终点向回数；今天还没记录不打断连续（从昨天起算）。
 */
export function computeStreak(dates: ReadonlySet<string>, today: string): number {
  let cursor = dates.has(today) ? today : addDays(today, -1)
  if (!dates.has(cursor)) return 0
  let n = 0
  while (dates.has(cursor)) {
    n += 1
    cursor = addDays(cursor, -1)
    if (n > 3660) break
  }
  return n
}

export interface MonthStats {
  days: number
}

/** 月度统计：有记录的天数（去重） */
export function monthStats(dates: ReadonlyArray<string>): MonthStats {
  return { days: new Set(dates).size }
}
