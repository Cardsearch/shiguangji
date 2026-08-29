import { describe, expect, it } from 'vitest'
import type { Dish } from '../types'
import { filterDishes, pickDish } from './draw'

const dishes: Dish[] = [
  { id: '1', name: '番茄炒蛋', kcal: 320, minutes: 10, tags: ['家常', '快手', '素食'], ingredients: [], steps: [], coverColor: 'c-tomato' },
  { id: '2', name: '红烧排骨', kcal: 550, minutes: 60, tags: ['家常', '高蛋白'], ingredients: [], steps: [], coverColor: 'c-cocoa' },
  { id: '3', name: '凉拌黄瓜', kcal: 90, minutes: 8, tags: ['快手', '素食', '低卡'], ingredients: [], steps: [], coverColor: 'c-veg' },
  { id: '4', name: '西红柿炖牛腩', kcal: 520, minutes: 90, tags: ['家常', '暖胃', '高蛋白'], ingredients: [], steps: [], coverColor: 'c-tomato' },
]

describe('filterDishes', () => {
  it('不限返回全量', () => {
    expect(filterDishes(dishes, '不限')).toHaveLength(4)
  })
  it('低卡：≤450 kcal 或带低卡标签', () => {
    expect(filterDishes(dishes, '低卡').map(d => d.id)).toEqual(['1', '3'])
  })
  it('高蛋白按标签', () => {
    expect(filterDishes(dishes, '高蛋白').map(d => d.id)).toEqual(['2', '4'])
  })
  it('素食按标签', () => {
    expect(filterDishes(dishes, '素食').map(d => d.id)).toEqual(['1', '3'])
  })
  it('10分钟快手：≤10 分钟或带快手标签', () => {
    expect(filterDishes(dishes, '10分钟快手').map(d => d.id)).toEqual(['1', '3'])
  })
})

describe('pickDish', () => {
  it('rng=0 取池内第一道，rng≈1 取最后一道', () => {
    expect(pickDish(dishes, '不限', () => 0)?.id).toBe('1')
    expect(pickDish(dishes, '不限', () => 0.999)?.id).toBe('4')
  })
  it('池为空返回 null（不抛错）', () => {
    expect(pickDishes_empty()).toBeNull()
  })
  function pickDishes_empty(): Dish | null {
    return pickDish([], '素食', () => 0.5)
  }
})
