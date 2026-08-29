/** 注册/登录表单的纯校验规则（可单测） */

export function validateUsername(v: string): string | null {
  const t = v.trim()
  if (t.length < 2) return '用户名至少 2 个字符'
  if (t.length > 20) return '用户名最长 20 个字符'
  return null
}

export function validatePassword(v: string): string | null {
  if (v.length < 8) return '密码至少 8 位'
  if (!/[a-zA-Z]/.test(v) || !/[0-9]/.test(v)) return '密码需同时包含字母和数字'
  return null
}

export function validateConfirm(pw: string, confirm: string): string | null {
  if (pw !== confirm) return '两次输入的密码不一致'
  return null
}
