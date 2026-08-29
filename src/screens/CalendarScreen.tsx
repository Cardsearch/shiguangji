import { useCallback, useEffect, useMemo, useState } from 'react'
import ReceiptRow from '../components/ReceiptRow'
import { addDays, fmtDateCN, monthMeta, monthRangeStr, pad2, todayStr } from '../lib/date'
import { listByRange } from '../lib/repos/records'
import { computeStreak } from '../lib/summary'
import type { FoodRecord } from '../types'

const WEEK_HEADS = ['一', '二', '三', '四', '五', '六', '日'] as const

export default function CalendarScreen({ uid }: { uid: string }) {
  const today = todayStr()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [selected, setSelected] = useState<string>(today)
  const [monthRecords, setMonthRecords] = useState<FoodRecord[] | null>(null)
  const [streakDays, setStreakDays] = useState<number>(0)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const { start, end } = monthRangeStr(year, month)
      // 连续打卡需要跨月窗口：从 60 天前到本月末（或今天，取较大者）
      const winEnd = end > today ? end : today
      const [mr, wr] = await Promise.all([
        listByRange(uid, start, end),
        listByRange(uid, addDays(today, -60), winEnd),
      ])
      setMonthRecords(mr)
      setStreakDays(computeStreak(new Set(wr.map(r => r.date)), today))
      setError(null)
    } catch {
      setError('日历数据加载失败，请重试')
    }
  }, [uid, year, month, today])

  useEffect(() => {
    void load()
  }, [load])

  const meta = useMemo(() => monthMeta(year, month), [year, month])

  const recordDates = useMemo(() => new Set((monthRecords ?? []).map(r => r.date)), [monthRecords])
  const monthTotal = useMemo(() => (monthRecords ?? []).reduce((s, r) => s + r.kcal, 0), [monthRecords])
  const avgKcal = recordDates.size > 0 ? Math.round(monthTotal / recordDates.size) : 0
  const dayRecords = useMemo(() => (monthRecords ?? []).filter(r => r.date === selected), [monthRecords, selected])
  const dayTotal = dayRecords.reduce((s, r) => s + r.kcal, 0)

  function shiftMonth(delta: number) {
    const d = new Date(year, month - 1 + delta, 1)
    setYear(d.getFullYear())
    setMonth(d.getMonth() + 1)
  }

  const cells: Array<{ day: number | null }> = [
    ...Array.from({ length: meta.pads }, () => ({ day: null })),
    ...Array.from({ length: meta.days }, (_, i) => ({ day: i + 1 })),
  ]

  return (
    <div className="screen">
      <header className="app-head">
        <div>
          <p className="eyebrow">日历 · 历史记录</p>
          <h2 className="greet" style={{ fontSize: 22 }}>
            {year}年{month}月
          </h2>
        </div>
        <div className="mon-nav">
          <button type="button" className="icon-btn" aria-label="上一月" onClick={() => shiftMonth(-1)}>
            <i className="fa-solid fa-chevron-left" />
          </button>
          <button type="button" className="icon-btn" aria-label="下一月" onClick={() => shiftMonth(1)}>
            <i className="fa-solid fa-chevron-right" />
          </button>
        </div>
      </header>

      {error && (
        <div className="form-error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="cal-stats">
        <div>
          <b>{recordDates.size}</b>
          <span>记录天数</span>
        </div>
        <div>
          <b>{streakDays}</b>
          <span>连续打卡</span>
        </div>
        <div>
          <b>{avgKcal > 0 ? avgKcal.toLocaleString() : '0'}</b>
          <span>日均 kcal</span>
        </div>
      </div>

      <div className="cal" role="grid" aria-label={`${year}年${month}月日历`}>
        <div className="cal-week">
          {WEEK_HEADS.map(w => (
            <span key={w}>{w}</span>
          ))}
        </div>
        <div className="cal-grid">
          {cells.map((c, i) =>
            c.day === null ? (
              <span key={`pad-${i}`} className="cal-day pad" aria-hidden="true" />
            ) : (
              (() => {
                const ds = `${year}-${pad2(month)}-${pad2(c.day)}`
                const cls = [
                  'cal-day',
                  recordDates.has(ds) ? 'has' : '',
                  ds === today ? 'today' : '',
                  ds === selected ? 'sel' : '',
                ]
                  .filter(Boolean)
                  .join(' ')
                return (
                  <button
                    key={ds}
                    type="button"
                    className={cls}
                    onClick={() => setSelected(ds)}
                    aria-label={`${ds}${recordDates.has(ds) ? '，有记录' : ''}`}
                    aria-pressed={ds === selected}
                  >
                    {c.day}
                  </button>
                )
              })()
            ),
          )}
        </div>
      </div>

      <div className="cal-detail">
        <h3 className="cd-title">{fmtDateCN(selected)}</h3>
        <p className="cd-sub">
          摄入 {dayTotal.toLocaleString()} kcal · {dayRecords.length} 条记录
        </p>
        {dayRecords.length > 0 ? (
          dayRecords.map(r => (
            <ReceiptRow key={r.id} record={r} onEdit={() => undefined} onDelete={() => undefined} />
          ))
        ) : (
          <div className="cd-empty">
            <i className="fa-regular fa-folder-open" aria-hidden="true" />
            这一天没有留下记录
            <br />
            <span className="mono" style={{ fontSize: 10 }}>
              补记入口：今日主页「+」
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
