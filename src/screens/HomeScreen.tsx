import { useCallback, useEffect, useState } from 'react'
import ReceiptRow from '../components/ReceiptRow'
import TicketCard from '../components/TicketCard'
import type { ShowToast } from '../components/Toast'
import { fmtDateCN, mealNow, todayStr } from '../lib/date'
import { loadProfile, type ProfileDoc } from '../lib/repos/profile'
import { deleteRecord, listByDate } from '../lib/repos/records'
import { summarizeDay } from '../lib/summary'
import { MEAL_LABEL, MEAL_ORDER, type FoodRecord, type MealType } from '../types'
import type { View } from '../views'

interface Props {
  uid: string
  showToast: ShowToast
  goto: (v: View) => void
  onEdit: (r: FoodRecord) => void
  onAdd: (date: string) => void
}

function greeting(): string {
  return mealNow() === 'breakfast' ? '早上好' : mealNow() === 'lunch' ? '中午好' : mealNow() === 'dinner' ? '晚上好' : '夜深了'
}

export default function HomeScreen({ uid, showToast, goto, onEdit, onAdd }: Props) {
  const date = todayStr()
  const [profile, setProfile] = useState<ProfileDoc | null>(null)
  const [records, setRecords] = useState<FoodRecord[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [p, rs] = await Promise.all([loadProfile(uid), listByDate(uid, date)])
      setProfile(p)
      setRecords(rs)
      setError(null)
    } catch {
      setError('数据加载失败，请检查网络后重试')
    }
  }, [uid, date])

  useEffect(() => {
    void refresh()
  }, [refresh])

  async function handleDelete(r: FoodRecord) {
    if (!window.confirm(`删除「${r.name}」这条记录？`)) return
    try {
      await deleteRecord(uid, r.id)
      showToast('已删除')
      void refresh()
    } catch (e) {
      showToast(e instanceof Error ? e.message : '删除失败，请重试')
    }
  }

  const summary = summarizeDay(records ?? [])
  const nickname = profile?.nickname?.trim() || '吃货'
  const target = profile?.dailyTargetKcal ?? 1800
  const loading = records === null

  return (
    <div className="screen">
      <header className="app-head">
        <div>
          <p className="eyebrow">
            {date} · {fmtDateCN(date).split(' · ')[1]}
          </p>
          <h2 className="greet">
            {greeting()}，{nickname}
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button type="button" className="icon-btn" aria-label="设置" onClick={() => goto('settings')}>
            <i className="fa-solid fa-gear" />
          </button>
          <button type="button" className="streak" onClick={() => goto('calendar')} aria-label="查看日历">
            <i className="fa-solid fa-fire" aria-hidden="true" />
            今日 {summary.count} 条
          </button>
        </div>
      </header>

      {error && (
        <div className="form-error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>
            {error}{' '}
            <button type="button" onClick={() => void refresh()}>
              重试
            </button>
          </span>
        </div>
      )}

      <TicketCard consumed={summary.totalKcal} target={target} count={summary.count} />

      <div className="quick">
        <button type="button" className="qk t1" onClick={() => onAdd(date)}>
          <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
          记一餐
        </button>
        <button type="button" className="qk t2" onClick={() => goto('random')}>
          <i className="fa-solid fa-dice" aria-hidden="true" />
          来一餐
        </button>
        <button type="button" className="qk t3" onClick={() => goto('ai')}>
          <i className="fa-solid fa-robot" aria-hidden="true" />
          问 AI
        </button>
      </div>

      {loading && (
        <div className="empty-hero">
          <div className="spin" style={{ margin: '0 auto' }} aria-label="加载中" />
        </div>
      )}

      {!loading && records !== null && records.length === 0 && (
        <div className="empty-hero">
          <p className="muted">今天还没留下任何记录</p>
          <div className="rc-empty">
            <p>记下第一餐，只要 10 秒</p>
            <button type="button" className="btn primary sm" onClick={() => onAdd(date)}>
              <i className="fa-solid fa-pen-to-square" aria-hidden="true" />
              记一餐
            </button>
          </div>
        </div>
      )}

      {!loading &&
        records !== null &&
        records.length > 0 &&
        MEAL_ORDER.map((m: MealType) => {
          const list = summary.byMeal[m]
          return (
            <section className="meal" key={m}>
              <div className="meal-head">
                <h3>
                  <span className={`dot m-${m}`} aria-hidden="true" />
                  {MEAL_LABEL[m]}
                </h3>
                <span className="sum">
                  {summary.kcalByMeal[m].toLocaleString()} kcal · {list.length} 条
                </span>
              </div>
              {list.map(r => (
                <ReceiptRow key={r.id} record={r} onEdit={onEdit} onDelete={r => void handleDelete(r)} />
              ))}
              {list.length === 0 && (
                <div className="rc-empty">
                  <p>还没记录{MEAL_LABEL[m]}</p>
                  {m === 'dinner' && (
                    <button type="button" className="btn ghost sm" onClick={() => goto('random')}>
                      <i className="fa-solid fa-dice" aria-hidden="true" />
                      去来一餐抽一个
                    </button>
                  )}
                </div>
              )}
            </section>
          )
        })}
    </div>
  )
}
