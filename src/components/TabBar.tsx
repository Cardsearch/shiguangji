import type { View } from '../views'

const TABS: ReadonlyArray<{ key: View; icon: string; label: string }> = [
  { key: 'home', icon: 'fa-solid fa-house', label: '今日' },
  { key: 'random', icon: 'fa-solid fa-dice', label: '来一餐' },
  { key: 'ai', icon: 'fa-solid fa-robot', label: '问 AI' },
  { key: 'calendar', icon: 'fa-solid fa-calendar-days', label: '日历' },
]

export function activeTabOf(view: View): View {
  return view === 'entry' || view === 'settings' ? 'home' : view
}

export default function TabBar({ view, onChange }: { view: View; onChange: (v: View) => void }) {
  const active = activeTabOf(view)
  const left = TABS.slice(0, 2)
  const right = TABS.slice(2)
  const renderTab = (t: { key: View; icon: string; label: string }) => (
    <button
      key={t.key}
      type="button"
      className={`tab ${active === t.key ? 'on' : ''}`}
      onClick={() => onChange(t.key)}
      aria-label={t.label}
      aria-current={active === t.key ? 'page' : undefined}
    >
      <i className={t.icon} aria-hidden="true" />
      <span>{t.label}</span>
    </button>
  )
  return (
    <nav className="tabbar" aria-label="主导航">
      {left.map(renderTab)}
      <span className="tab-gap" aria-hidden="true" />
      {right.map(renderTab)}
    </nav>
  )
}
