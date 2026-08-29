import { db } from '../cloudbase'
import type { Dish } from '../../types'

const COL = 'dishes'

function toDish(x: unknown): Dish | null {
  if (typeof x !== 'object' || x === null) return null
  const d = x as Record<string, unknown>
  if (typeof d._id !== 'string' || typeof d.name !== 'string' || !d.name) return null
  return {
    id: d._id,
    name: d.name,
    kcal: typeof d.kcal === 'number' && Number.isFinite(d.kcal) ? d.kcal : 0,
    minutes: typeof d.minutes === 'number' && Number.isFinite(d.minutes) ? d.minutes : 15,
    tags: Array.isArray(d.tags) ? d.tags.filter((t): t is string => typeof t === 'string') : [],
    ingredients: Array.isArray(d.ingredients) ? d.ingredients.filter((t): t is string => typeof t === 'string') : [],
    steps: Array.isArray(d.steps) ? d.steps.filter((t): t is string => typeof t === 'string') : [],
    coverColor: typeof d.coverColor === 'string' ? d.coverColor : 'c-tomato',
  }
}

/** 菜库为全局只读（规则：登录可读、客户端禁写），一次取 100 道 */
export async function listDishes(): Promise<Dish[]> {
  const res = await db.collection(COL).limit(100).get()
  const data = (res as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) return []
  return data.map(toDish).filter((d): d is Dish => d !== null)
}
