import type { Recipe } from '../types'

/** AI 返回食谱的运行时守卫（服务端已清洗，客户端仍不信任） */
export function isRecipe(x: unknown): x is Recipe {
  if (typeof x !== 'object' || x === null) return false
  const r = x as Record<string, unknown>
  if (typeof r.name !== 'string' || !r.name.trim()) return false
  if (typeof r.kcal !== 'number' || !Number.isFinite(r.kcal)) return false
  if (typeof r.minutes !== 'number' || !Number.isFinite(r.minutes)) return false
  const arrOk = (v: unknown): v is string[] => Array.isArray(v) && v.every(t => typeof t === 'string')
  return arrOk(r.ingredients) && arrOk(r.steps) && arrOk(r.tags)
}
