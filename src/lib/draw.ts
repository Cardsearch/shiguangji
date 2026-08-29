import type { Dish } from '../types'

export const RANDOM_TAGS = ['不限', '低卡', '高蛋白', '素食', '10分钟快手'] as const
export type RandomTag = (typeof RANDOM_TAGS)[number]

/** 按筛选标签过滤抽取池（纯函数，可单测） */
export function filterDishes(dishes: readonly Dish[], tag: RandomTag): Dish[] {
  if (tag === '不限') return [...dishes]
  if (tag === '低卡') return dishes.filter(d => d.kcal <= 450 || d.tags.includes('低卡'))
  if (tag === '高蛋白') return dishes.filter(d => d.tags.includes('高蛋白'))
  if (tag === '素食') return dishes.filter(d => d.tags.includes('素食'))
  return dishes.filter(d => d.minutes <= 10 || d.tags.includes('快手'))
}

/** 注入随机源的抽取（可单测、可复现） */
export function pickDish(dishes: readonly Dish[], tag: RandomTag, rng: () => number = Math.random): Dish | null {
  const pool = filterDishes(dishes, tag)
  if (pool.length === 0) return null
  const idx = Math.floor(rng() * pool.length)
  const d = pool[Math.min(Math.max(idx, 0), pool.length - 1)]
  return d ?? null
}

/** 素食偏好：从已过滤的池中再排除荤菜（只留素食标签） */
export function restrictVegetarian(pool: readonly Dish[]): Dish[] {
  return pool.filter(d => d.tags.includes('素食'))
}

/** 从给定池中随机取一道（Math.random 注入点） */
export function pickFrom(pool: readonly Dish[], rng: () => number = Math.random): Dish | null {
  if (pool.length === 0) return null
  const idx = Math.floor(rng() * pool.length)
  return pool[Math.min(Math.max(idx, 0), pool.length - 1)] ?? null
}
