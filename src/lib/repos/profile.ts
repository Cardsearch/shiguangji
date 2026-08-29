import { db } from '../cloudbase'
import type { Profile } from '../../types'

const COL = 'profiles'
export const DEFAULT_PROFILE: Profile = { nickname: '', dailyTargetKcal: 1800, vegetarian: false }

export interface ProfileDoc extends Profile {
  docId: string | null
}

function numOf(v: unknown, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : fallback
}

export async function loadProfile(uid: string): Promise<ProfileDoc> {
  // 查询需显式带 _openid 约束以通过安全规则（见 records.ts 说明）
  const res = (await db.collection(COL).where({ _openid: uid, userId: uid }).limit(1).get()) as { data?: unknown }
  const arr = Array.isArray(res?.data) ? res.data : []
  const d = (arr[0] ?? null) as Record<string, unknown> | null
  if (!d) return { ...DEFAULT_PROFILE, docId: null }
  return {
    nickname: typeof d.nickname === 'string' ? d.nickname : '',
    dailyTargetKcal: numOf(d.dailyTargetKcal, DEFAULT_PROFILE.dailyTargetKcal),
    vegetarian: d.vegetarian === true,
    docId: typeof d._id === 'string' ? d._id : null,
  }
}

export async function saveProfile(uid: string, docId: string | null, p: Profile): Promise<void> {
  if (docId) {
    // 条件更新替代 doc(id).update（网关对 doc 定向写不执行 doc.* 规则，见 records.ts 说明）
    const res = (await db
      .collection(COL)
      .where({ _openid: uid, userId: uid, _id: docId })
      .update({ ...p, updatedAt: Date.now() })) as { updated?: unknown; code?: unknown }
    if (typeof res?.code === 'string' && res.code) throw new Error('保存失败：权限不足')
    if (typeof res?.updated === 'number' && res.updated < 1) throw new Error('保存失败：档案不存在')
    return
  }
  await db.collection(COL).add({ _openid: uid, userId: uid, ...p, createdAt: Date.now() })
}
