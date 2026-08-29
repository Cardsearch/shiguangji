import { useEffect, useState } from 'react'
import type { ShowToast } from '../components/Toast'
import { listDishes } from '../lib/repos/dishes'
import { loadProfile } from '../lib/repos/profile'
import { addRecord } from '../lib/repos/records'
import { filterDishes, pickFrom, RANDOM_TAGS, restrictVegetarian, type RandomTag } from '../lib/draw'
import { mealNow, todayStr } from '../lib/date'
import { MEAL_LABEL, type Dish } from '../types'
import type { View } from '../views'

interface Props {
  uid: string
  showToast: ShowToast
  goto: (v: View) => void
}

function coverClass(d: Dish | null): string {
  const key = d?.coverColor.replace(/^c-/, '') ?? 'tomato'
  return `c-c-${key}`
}

export default function RandomScreen({ uid, showToast, goto }: Props) {
  const [dishes, setDishes] = useState<Dish[] | null>(null)
  const [tag, setTag] = useState<RandomTag>('不限')
  const [current, setCurrent] = useState<Dish | null>(null)
  const [drawn, setDrawn] = useState(false)
  const [saving, setSaving] = useState(false)
  const [vegetarian, setVegetarian] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listDishes()
      .then(setDishes)
      .catch(() => setError('菜库加载失败，请刷新重试'))
    loadProfile(uid)
      .then(p => setVegetarian(p.vegetarian))
      .catch(() => undefined)
  }, [uid])

  function draw() {
    if (!dishes) return
    let pool = filterDishes(dishes, tag)
    if (vegetarian) pool = restrictVegetarian(pool)
    const d = pickFrom(pool)
    if (!d) {
      showToast(vegetarian && pool.length === 0 ? '素食池在该筛选下没有菜，换个筛选试试' : '该筛选下没有可抽的菜，换一个筛选试试')
      return
    }
    setCurrent(d)
    setDrawn(true)
  }

  function changeTag(t: RandomTag) {
    setTag(t)
    setDrawn(false)
    setCurrent(null)
    // 抽取池变化即时生效：再次点击骰子时按新池抽取
    void filterDishes(dishes ?? [], t).length
  }

  async function recordThis() {
    if (!current || saving) return
    setSaving(true)
    try {
      await addRecord(uid, {
        date: todayStr(),
        mealType: mealNow(),
        name: current.name,
        qty: 1,
        unit: '份',
        kcal: current.kcal,
        note: '',
        source: 'random',
      })
      showToast(`已记到${MEAL_LABEL[mealNow()]}`)
      goto('home')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '记录失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  const basePool = dishes ? filterDishes(dishes, tag) : []
  const poolSize = vegetarian ? restrictVegetarian(basePool).length : basePool.length

  return (
    <div className="screen">
      <header className="app-head">
        <div>
          <p className="eyebrow">来一餐 · 随机推荐</p>
          <h2 className="greet">今天吃什么？</h2>
        </div>
      </header>

      {error && (
        <div className="form-error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div className="fchips" role="radiogroup" aria-label="筛选">
        {RANDOM_TAGS.map(t => (
          <button
            type="button"
            key={t}
            className={`fchip ${tag === t ? 'on' : ''}`}
            aria-pressed={tag === t}
            onClick={() => changeTag(t)}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="draw">
        {!drawn && (
          <div className="draw-idle">
            <button type="button" className="draw-btn" aria-label="随机抽一餐" onClick={() => draw()}>
              <i className="fa-solid fa-dice" />
            </button>
            <p>
              点一下，<b>随机抽一餐</b>
            </p>
          </div>
        )}
        {drawn && current && (
          <div className="draw-card" key={current.id}>
            <div className={`dc-cover ${coverClass(current)}`}>
              <span className="dc-mono" aria-hidden="true">
                {current.name.slice(0, 1)}
              </span>
            </div>
            <div className="dc-body">
              <b className="dc-name">{current.name}</b>
              <p className="dc-meta">
                {current.kcal} kcal · {current.minutes} min
              </p>
              <div className="dc-tags">
                {current.tags.slice(0, 3).map(t => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="dc-acts">
                <button type="button" className="btn ghost" onClick={() => draw()}>
                  <i className="fa-solid fa-arrow-rotate-right" aria-hidden="true" />
                  换一个
                </button>
                <button type="button" className="btn primary" disabled={saving} onClick={() => void recordThis()}>
                  <i className="fa-solid fa-check" aria-hidden="true" />
                  {saving ? '记录中…' : '记录这一餐'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <p className="foot-note">
        菜库 {dishes ? `${dishes.length} 道` : '加载中'} · 当前筛选池 {poolSize} 道
      </p>
    </div>
  )
}
