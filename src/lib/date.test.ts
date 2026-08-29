import { describe, expect, it } from 'vitest'
import { addDays, dateStr, fmtDateCN, mealNow, monthMeta, monthRangeStr, todayStr, weekdayIdx } from './date'

describe('date 工具', () => {
  it('dateStr 输出本地时区 YYYY-MM-DD 并补零', () => {
    expect(dateStr(new Date(2026, 7, 29))).toBe('2026-08-29')
    expect(dateStr(new Date(2026, 0, 3))).toBe('2026-01-03')
  })

  it('todayStr 返回当天', () => {
    expect(todayStr()).toBe(dateStr(new Date()))
  })

  it('addDays 跨月与负数', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01')
    expect(addDays('2026-08-01', -1)).toBe('2026-07-31')
    expect(addDays('2026-08-29', -7)).toBe('2026-08-22')
  })

  it('weekdayIdx 周一=0 周日=6', () => {
    expect(weekdayIdx('2026-08-31')).toBe(0) // 周一
    expect(weekdayIdx('2026-08-29')).toBe(5) // 周六
    expect(weekdayIdx('2026-08-30')).toBe(6) // 周日
  })

  it('fmtDateCN 中文格式', () => {
    expect(fmtDateCN('2026-08-29')).toBe('8月29日 · 周六')
    expect(fmtDateCN('2026-01-01')).toBe('1月1日 · 周四')
  })

  it('monthMeta：2026-08 有 31 天，8月1日是周六因此补 5 格', () => {
    const m = monthMeta(2026, 8)
    expect(m.days).toBe(31)
    expect(m.pads).toBe(5)
    const m2 = monthMeta(2026, 2)
    expect(m2.days).toBe(28) // 2026 非闰年
  })

  it('monthRangeStr 覆盖整月', () => {
    expect(monthRangeStr(2026, 8)).toEqual({ start: '2026-08-01', end: '2026-08-31' })
  })

  it('mealNow 按时段推断餐次', () => {
    expect(mealNow(new Date(2026, 7, 29, 7, 30))).toBe('breakfast')
    expect(mealNow(new Date(2026, 7, 29, 12, 0))).toBe('lunch')
    expect(mealNow(new Date(2026, 7, 29, 18, 30))).toBe('dinner')
    expect(mealNow(new Date(2026, 7, 29, 15, 59))).toBe('lunch')
    expect(mealNow(new Date(2026, 7, 29, 23, 0))).toBe('snack')
    expect(mealNow(new Date(2026, 7, 29, 3, 0))).toBe('snack')
  })
})
