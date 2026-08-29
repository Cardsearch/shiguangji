import { db, _ } from '../cloudbase'
import { MEAL_ORDER, type FoodRecord, type MealType, type NewFoodRecord, type RecordSource } from '../../types'

const COL = 'food_records'
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// SDK 将 command.gte/lte 的参数类型窄化为 number，而 date 字段是字符串（服务端按字典序比较成立）。
// 注意必须用链式 _.gte(a).and(_.lte(b))：两参 _.and 形式会静默匹配 0 条（实测）。
const cmd = _ as unknown as {
  gte: (v: string) => { and: (other: unknown) => unknown }
  lte: (v: string) => unknown
}

function numOf(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback
}
function strOf(v: unknown, fallback: string): string {
  return typeof v === 'string' ? v : fallback
}

/** 数据库文档 → FoodRecord 的运行时守卫（禁 any，字段容错到合法默认值） */
export function toRecord(x: unknown): FoodRecord | null {
  if (typeof x !== 'object' || x === null) return null
  const d = x as Record<string, unknown>
  const id = d._id
  const date = d.date
  const name = d.name
  if (typeof id !== 'string' || !id) return null
  if (typeof date !== 'string' || !DATE_RE.test(date)) return null
  if (typeof name !== 'string' || !name) return null
  const mealType: MealType = (MEAL_ORDER as readonly unknown[]).includes(d.mealType) ? (d.mealType as MealType) : 'snack'
  const source: RecordSource = (['manual', 'random', 'ai'] as const).includes(d.source as RecordSource)
    ? (d.source as RecordSource)
    : 'manual'
  return {
    id,
    date,
    mealType,
    name,
    qty: numOf(d.qty, 1),
    unit: strOf(d.unit, '份'),
    kcal: numOf(d.kcal, 0),
    note: strOf(d.note, ''),
    source,
    createdAt: numOf(d.createdAt, Date.now()),
  }
}

function mapRecords(res: unknown): FoodRecord[] {
  const data = (res as { data?: unknown } | null)?.data
  if (!Array.isArray(data)) return []
  return data.map(toRecord).filter((r): r is FoodRecord => r !== null)
}

/**
 * 安全规则为 `doc._openid == auth.uid`。该网关对查询【不会】自动把规则合并为过滤条件，
 * 必须在 where 中显式带上 `_openid: uid`，规则校验才能通过（实测结论，见执行记录 M3）。
 */
export async function listByDate(uid: string, date: string): Promise<FoodRecord[]> {
  // 注：该网关不支持 orderBy 的 order 参数格式（INVALID_PARAM），排序在客户端完成
  const res = await db
    .collection(COL)
    .where({ _openid: uid, userId: uid, date })
    .limit(100)
    .get()
  return mapRecords(res).sort((a, b) => a.createdAt - b.createdAt)
}

/** 某区间内的全部记录（供日历打卡日期、月度统计与连续打卡计算） */
export async function listByRange(uid: string, start: string, end: string): Promise<FoodRecord[]> {
  const res = await db
    .collection(COL)
    .where({ _openid: uid, userId: uid, date: cmd.gte(start).and(cmd.lte(end)) })
    .limit(1000)
    .get()
  return mapRecords(res)
}

/** 新增记录。v3 网关的 add 响应不含 _id，调用方随后通过查询刷新（列表以 userId+date 检索）。 */
export async function addRecord(uid: string, rec: NewFoodRecord): Promise<void> {
  await db.collection(COL).add({ _openid: uid, userId: uid, ...rec })
}

/**
 * 按 ID 更新。该网关对 doc(id) 定向写不执行规则里的 doc.* 比较（实测 DENIED），
 * 改用带 _openid 约束的条件更新——规则保证 where 必须能命中自己的文档，安全性等价；
 * 须校验 updated > 0（见执行记录 0.4 提示）。
 */
export async function updateRecord(
  uid: string,
  id: string,
  patch: Partial<Omit<NewFoodRecord, 'userId'>>,
): Promise<void> {
  const res = (await db
    .collection(COL)
    .where({ _openid: uid, userId: uid, _id: id })
    .update({ ...patch, updatedAt: Date.now() })) as { updated?: unknown; code?: unknown }
  if (typeof res?.code === 'string' && res.code) throw new Error('保存失败：权限不足或记录不存在')
  if (typeof res?.updated === 'number' && res.updated < 1) throw new Error('保存失败：记录不存在或无权限')
}

/** 按 ID 删除：同 updateRecord，走条件删除并校验 deleted > 0 */
export async function deleteRecord(uid: string, id: string): Promise<void> {
  const res = (await db
    .collection(COL)
    .where({ _openid: uid, userId: uid, _id: id })
    .remove()) as { deleted?: unknown; code?: unknown }
  if (typeof res?.code === 'string' && res.code) throw new Error('删除失败：权限不足或记录不存在')
  if (typeof res?.deleted === 'number' && res.deleted < 1) throw new Error('删除失败：记录不存在或无权限')
}
