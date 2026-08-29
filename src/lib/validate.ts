/** 录入表单的纯校验规则（可单测），与 PRD 3.3 的字段约束一致 */

export interface EntryFormValues {
  name: string
  qty: number
  kcal: number | null
}

export interface EntryErrors {
  name?: string
  qty?: string
  kcal?: string
}

export function validateEntry(v: EntryFormValues): EntryErrors {
  const errors: EntryErrors = {}
  if (!v.name.trim()) errors.name = '请填写食物名称'
  else if (v.name.trim().length > 30) errors.name = '名称最长 30 个字符'
  if (!Number.isFinite(v.qty) || v.qty < 0.1 || v.qty > 50) errors.qty = '份数需在 0.1–50 之间'
  if (v.kcal !== null && (!Number.isFinite(v.kcal) || v.kcal < 0 || v.kcal > 5000)) {
    errors.kcal = '热量需在 0–5000 kcal'
  }
  return errors
}

export function hasErrors(e: EntryErrors): boolean {
  return Boolean(e.name || e.qty || e.kcal)
}
