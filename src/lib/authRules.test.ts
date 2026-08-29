import { describe, expect, it } from 'vitest'
import { validateConfirm, validatePassword, validateUsername } from './authRules'

describe('authRules', () => {
  it('用户名 2-20 字符', () => {
    expect(validateUsername('a')).toBe('用户名至少 2 个字符')
    expect(validateUsername(' tester01 ')).toBeNull()
    expect(validateUsername('x'.repeat(21))).toBe('用户名最长 20 个字符')
  })

  it('密码至少 8 位且含字母和数字', () => {
    expect(validatePassword('ab12')).toBe('密码至少 8 位')
    expect(validatePassword('abcdefgh')).toBe('密码需同时包含字母和数字')
    expect(validatePassword('12345678')).toBe('密码需同时包含字母和数字')
    expect(validatePassword('Sample123')).toBeNull()
  })

  it('确认密码一致', () => {
    expect(validateConfirm('Sample123', 'Sample123')).toBeNull()
    expect(validateConfirm('Sample123', 'Sample124')).toBe('两次输入的密码不一致')
  })
})
