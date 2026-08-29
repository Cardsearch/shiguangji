import { describe, expect, it } from 'vitest'
import { isRecipe } from './recipe'

describe('isRecipe 守卫', () => {
  it('合法食谱通过', () => {
    expect(
      isRecipe({ name: '番茄炒蛋', kcal: 320, minutes: 10, ingredients: ['鸡蛋'], steps: ['炒'], tags: ['家常'] }),
    ).toBe(true)
  })
  it('缺字段/类型不对则拒绝', () => {
    expect(isRecipe(null)).toBe(false)
    expect(isRecipe({})).toBe(false)
    expect(isRecipe({ name: '', kcal: 1, minutes: 1, ingredients: [], steps: [], tags: [] })).toBe(false)
    expect(isRecipe({ name: 'x', kcal: 'many', minutes: 1, ingredients: [], steps: [], tags: [] })).toBe(false)
    expect(isRecipe({ name: 'x', kcal: 1, minutes: 1, ingredients: '鸡蛋', steps: [], tags: [] })).toBe(false)
  })
})
