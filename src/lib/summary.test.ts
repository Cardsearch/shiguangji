import { describe, expect, it } from 'vitest'
import type { FoodRecord } from '../types'
import { computeStreak, summarizeDay } from './summary'

function rec(partial: Partial<FoodRecord> & { id: string }): FoodRecord {
  return {
    date: '2026-08-29',
    mealType: 'lunch',
    name: '测试食物',
    qty: 1,
    unit: '份',
    kcal: 100,
    note: '',
    source: 'manual',
    createdAt: 0,
    ...partial,
  }
}

describe('summarizeDay', () => {
  it('合计与餐次分组、组内按时间排序', () => {
    const s = summarizeDay([
      rec({ id: 'a', mealType: 'lunch', kcal: 612, createdAt: 200 }),
      rec({ id: 'b', mealType: 'breakfast', kcal: 156, createdAt: 100 }),
      rec({ id: 'c', mealType: 'lunch', kcal: 45, createdAt: 150 }),
      rec({ id: 'd', mealType: 'snack', kcal: 5, createdAt: 300 }),
    ])
    expect(s.totalKcal).toBe(818)
    expect(s.count).toBe(4)
    expect(s.byMeal.breakfast.map(r => r.id)).toEqual(['b'])
    expect(s.byMeal.lunch.map(r => r.id)).toEqual(['c', 'a'])
    expect(s.kcalByMeal.lunch).toBe(657)
    expect(s.kcalByMeal.dinner).toBe(0)
  })

  it('空记录汇总为零', () => {
    const s = summarizeDay([])
    expect(s.totalKcal).toBe(0)
    expect(s.count).toBe(0)
    expect(s.byMeal.lunch).toEqual([])
  })
})

describe('computeStreak', () => {
  it('今天有记录：从今天向回连续计数', () => {
    const dates = new Set(['2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29'])
    expect(computeStreak(dates, '2026-08-29')).toBe(5)
  })

  it('今天还没记录：从昨天起算不打断', () => {
    const dates = new Set(['2026-08-27', '2026-08-28'])
    expect(computeStreak(dates, '2026-08-29')).toBe(2)
  })

  it('中间断档即停止', () => {
    const dates = new Set(['2026-08-25', '2026-08-29'])
    expect(computeStreak(dates, '2026-08-29')).toBe(1)
  })

  it('完全无记录为 0', () => {
    expect(computeStreak(new Set(), '2026-08-29')).toBe(0)
  })
})
