import { describe, expect, it } from 'vitest'
import { restrictVegetarian } from './draw'
import type { Dish } from '../types'

const base: Dish[] = [
  { id: '1', name: '番茄炒蛋', kcal: 320, minutes: 10, tags: ['家常', '快手', '素食'], ingredients: [], steps: [], coverColor: 'c-tomato' },
  { id: '2', name: '红烧排骨', kcal: 550, minutes: 60, tags: ['家常', '高蛋白'], ingredients: [], steps: [], coverColor: 'c-cocoa' },
]

describe('restrictVegetarian（素食偏好过滤随机池）', () => {
  it('只保留带素食标签的菜', () => {
    expect(restrictVegetarian(base).map(d => d.id)).toEqual(['1'])
  })
  it('空池安全', () => {
    expect(restrictVegetarian([])).toEqual([])
  })
})
