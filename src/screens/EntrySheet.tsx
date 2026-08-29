import { useState } from 'react'
import type { FormEvent } from 'react'
import type { ShowToast } from '../components/Toast'
import { estimateKcal } from '../lib/ai'
import { addDays, mealNow, todayStr } from '../lib/date'
import { addRecord, updateRecord } from '../lib/repos/records'
import { hasErrors, validateEntry } from '../lib/validate'
import { MEAL_LABEL, MEAL_ORDER, type FoodRecord, type MealType, type RecordSource } from '../types'

export interface EntryDraft {
  date: string
  edit?: FoodRecord
}

const QUICK_FOODS: ReadonlyArray<{ name: string; unit: string; kcal: number }> = [
  { name: '水煮蛋', unit: '个', kcal: 78 },
  { name: '无糖豆浆', unit: '杯', kcal: 80 },
  { name: '燕麦碗', unit: '碗', kcal: 250 },
  { name: '美式咖啡', unit: '杯', kcal: 5 },
  { name: '全麦面包', unit: '片', kcal: 89 },
  { name: '鸡胸肉', unit: '份', kcal: 220 },
]

/** 本地常见食物映射：AI 估算失败时的降级方案 */
function estimateLocal(name: string): number | null {
  const n = name.trim()
  const hit = QUICK_FOODS.find(f => f.name === n || n.includes(f.name))
  return hit ? hit.kcal : null
}

interface Props {
  uid: string
  draft: EntryDraft
  onBack: () => void
  onSaved: () => void
  showToast: ShowToast
}

export default function EntrySheet({ uid, draft, onBack, onSaved, showToast }: Props) {
  const editing = draft.edit ?? null
  const [name, setName] = useState(editing?.name ?? '')
  const [mealType, setMealType] = useState<MealType>(editing?.mealType ?? mealNow())
  const [qty, setQty] = useState<number>(editing?.qty ?? 1)
  const [unit, setUnit] = useState<string>(editing?.unit ?? '份')
  const [kcal, setKcal] = useState<string>(editing ? String(editing.kcal) : '')
  const [note, setNote] = useState<string>(editing?.note ?? '')
  const [date, setDate] = useState<string>(draft.date || todayStr())
  const [errors, setErrors] = useState<ReturnType<typeof validateEntry>>({})
  const [busy, setBusy] = useState(false)
  const [estimating, setEstimating] = useState(false)

  const maxDate = todayStr()
  const minDate = addDays(maxDate, -7)

  function applyQuick(food: { name: string; kcal: number }) {
    setName(food.name)
    if (!kcal) setKcal(String(food.kcal))
  }

  async function applyEstimate() {
    const n = name.trim()
    if (!n) {
      showToast('先填写食物名称再估算')
      return
    }
    if (estimating) return
    setEstimating(true)
    try {
      const v = await estimateKcal(n, qty, unit)
      if (v !== null) {
        setKcal(String(v))
        showToast('AI 估算完成，可修改')
        return
      }
      const local = estimateLocal(n)
      if (local !== null) {
        setKcal(String(Math.round(local * (Number.isFinite(qty) ? qty : 1))))
        showToast('已按常见份量估算，可修改')
        return
      }
      showToast('估算暂不可用，可手动填写热量')
    } finally {
      setEstimating(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const kcalNum = kcal.trim() === '' ? null : Number(kcal)
    const errs = validateEntry({ name, qty, kcal: kcalNum })
    setErrors(errs)
    if (hasErrors(errs)) return
    setBusy(true)
    try {
      const values = {
        date,
        mealType,
        name: name.trim(),
        qty,
        unit,
        kcal: kcalNum ?? 0,
        note: note.trim(),
      }
      if (editing) {
        await updateRecord(uid, editing.id, values)
        showToast('已更新记录')
      } else {
        const source: RecordSource = 'manual'
        await addRecord(uid, { ...values, source })
        showToast(`已记到${MEAL_LABEL[mealType]}`)
      }
      onSaved()
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen no-tab">
      <div className="sheet-head">
        <button type="button" className="icon-btn" aria-label="返回" onClick={onBack}>
          <i className="fa-solid fa-chevron-left" />
        </button>
        <h3>{editing ? '编辑记录' : '记一餐'}</h3>
        <span className="date-chip">{date}</span>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="entry-name">
            吃了什么 <small>必填</small>
          </label>
          <div className="inp">
            <i className="fa-solid fa-bowl-food" aria-hidden="true" />
            <input
              id="entry-name"
              value={name}
              maxLength={30}
              placeholder="如：番茄牛腩盖饭"
              onChange={e => setName(e.target.value)}
            />
          </div>
          {errors.name && <p className="fine" style={{ textAlign: 'left', color: 'var(--tomato-deep)' }}>{errors.name}</p>}
        </div>

        <div className="quick-chips" aria-label="常吃食物">
          {QUICK_FOODS.map(f => (
            <button type="button" key={f.name} className="qc" onClick={() => applyQuick(f)}>
              {f.name}
            </button>
          ))}
        </div>

        <div className="field">
          <label>餐次</label>
          <div className="seg4" role="radiogroup" aria-label="餐次">
            {MEAL_ORDER.map(m => (
              <button
                type="button"
                key={m}
                className={mealType === m ? 'on' : ''}
                onClick={() => setMealType(m)}
                aria-pressed={mealType === m}
              >
                {MEAL_LABEL[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="row2">
          <div className="field">
            <label htmlFor="entry-qty">份数</label>
            <div className="stepper">
              <button
                type="button"
                aria-label="减少 0.5"
                onClick={() => setQty(q => Math.max(0.5, Math.round((q - 0.5) * 10) / 10))}
              >
                <i className="fa-solid fa-minus" />
              </button>
              <b aria-live="polite">{qty.toFixed(1)}</b>
              <button
                type="button"
                aria-label="增加 0.5"
                onClick={() => setQty(q => Math.min(50, Math.round((q + 0.5) * 10) / 10))}
              >
                <i className="fa-solid fa-plus" />
              </button>
            </div>
            {errors.qty && <p className="fine" style={{ textAlign: 'left', color: 'var(--tomato-deep)' }}>{errors.qty}</p>}
          </div>
          <div className="field">
            <label htmlFor="entry-unit">单位</label>
            <div className="inp sel">
              <select id="entry-unit" value={unit} onChange={e => setUnit(e.target.value)}>
                <option>份</option>
                <option>碗</option>
                <option>个</option>
                <option>杯</option>
                <option>片</option>
                <option>克</option>
              </select>
            </div>
          </div>
        </div>

        <div className="field">
          <label htmlFor="entry-kcal">
            热量 <small>可留空，点右侧估算</small>
          </label>
          <div className="row-kcal">
            <div className="inp">
              <input
                id="entry-kcal"
                inputMode="numeric"
                placeholder="kcal"
                value={kcal}
                onChange={e => setKcal(e.target.value.replace(/[^\d]/g, ''))}
              />
              <i className="fa-solid fa-fire-flame-curved" aria-hidden="true" />
            </div>
            <button type="button" className="btn ghost sm" disabled={estimating} onClick={() => void applyEstimate()}>
              <i className={`fa-solid ${estimating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`} aria-hidden="true" />
              {estimating ? '估算中…' : 'AI 估算'}
            </button>
          </div>
          {errors.kcal && <p className="fine" style={{ textAlign: 'left', color: 'var(--tomato-deep)' }}>{errors.kcal}</p>}
        </div>

        <div className="field">
          <label htmlFor="entry-date">日期 <small>可补记过去 7 天</small></label>
          <div className="inp">
            <input
              id="entry-date"
              type="date"
              value={date}
              min={minDate}
              max={maxDate}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="entry-note">
            备注 <small>可选</small>
          </label>
          <div className="inp">
            <i className="fa-regular fa-note-sticky" aria-hidden="true" />
            <input
              id="entry-note"
              value={note}
              maxLength={50}
              placeholder="少油、外卖、和同事拼单…"
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? '保存中…' : (
            <>
              <i className="fa-solid fa-check" aria-hidden="true" />
              {editing ? '保存修改' : `保存到${MEAL_LABEL[mealType]}`}
            </>
          )}
        </button>
      </form>
    </div>
  )
}
