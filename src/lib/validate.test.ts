import { describe, expect, it } from 'vitest'
import { hasErrors, validateEntry } from './validate'

describe('validateEntry（PRD 3.3 字段约束）', () => {
  it('名称必填', () => {
    expect(validateEntry({ name: '  ', qty: 1, kcal: null }).name).toBe('请填写食物名称')
    expect(validateEntry({ name: '番茄炒蛋', qty: 1, kcal: null }).name).toBeUndefined()
  })

  it('名称长度上限 30', () => {
    expect(validateEntry({ name: 'x'.repeat(31), qty: 1, kcal: null }).name).toBe('名称最长 30 个字符')
  })

  it('份数 0.1–50', () => {
    expect(validateEntry({ name: 'a', qty: 0, kcal: null }).qty).toBeDefined()
    expect(validateEntry({ name: 'a', qty: 50.1, kcal: null }).qty).toBeDefined()
    expect(validateEntry({ name: 'a', qty: 1.5, kcal: null }).qty).toBeUndefined()
  })

  it('热量可留空，填了需 0–5000', () => {
    expect(validateEntry({ name: 'a', qty: 1, kcal: null }).kcal).toBeUndefined()
    expect(validateEntry({ name: 'a', qty: 1, kcal: 5001 }).kcal).toBeDefined()
    expect(validateEntry({ name: 'a', qty: 1, kcal: -1 }).kcal).toBeDefined()
    expect(validateEntry({ name: 'a', qty: 1, kcal: 612 }).kcal).toBeUndefined()
  })

  it('hasErrors 汇总判断', () => {
    expect(hasErrors({})).toBe(false)
    expect(hasErrors({ name: '请填写食物名称' })).toBe(true)
  })
})
