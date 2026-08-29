import { useCallback, useState } from 'react'
import TabBar from './components/TabBar'
import Toast, { type ShowToast } from './components/Toast'
import { todayStr } from './lib/date'
import type { View } from './views'
import EntrySheet, { type EntryDraft } from './screens/EntrySheet'
import HomeScreen from './screens/HomeScreen'
import CalendarScreen from './screens/CalendarScreen'
import RandomScreen from './screens/RandomScreen'
import AiScreen from './screens/AiScreen'
import SettingsScreen from './screens/SettingsScreen'
import PlaceholderScreen from './screens/Placeholder'

export default function AppShell({ uid, onSignOut }: { uid: string; onSignOut: () => void }) {
  const [view, setView] = useState<View>('home')
  const [toast, setToast] = useState<{ text: string; key: number } | null>(null)
  const [entryDraft, setEntryDraft] = useState<EntryDraft | null>(null)

  const showToast: ShowToast = useCallback((text: string) => setToast({ text, key: Date.now() }), [])
  const goto = useCallback((v: View) => setView(v), [])
  const openEntry = useCallback((d: EntryDraft) => {
    setEntryDraft(d)
    setView('entry')
  }, [])

  let content: JSX.Element
  switch (view) {
    case 'entry':
      content = entryDraft ? (
        <EntrySheet
          uid={uid}
          draft={entryDraft}
          onBack={() => setView('home')}
          onSaved={() => setView('home')}
          showToast={showToast}
        />
      ) : (
        <HomeScreen
          uid={uid}
          showToast={showToast}
          goto={goto}
          onEdit={() => undefined}
          onAdd={d => openEntry({ date: d })}
        />
      )
      break
    case 'home':
      content = (
        <HomeScreen
          uid={uid}
          showToast={showToast}
          goto={goto}
          onEdit={r => openEntry({ date: r.date, edit: r })}
          onAdd={d => openEntry({ date: d })}
        />
      )
      break
    case 'calendar':
      content = <CalendarScreen uid={uid} />
      break
    case 'random':
      content = <RandomScreen uid={uid} showToast={showToast} goto={goto} />
      break
    case 'ai':
      content = <AiScreen uid={uid} showToast={showToast} goto={goto} />
      break
    case 'settings':
      content = <SettingsScreen uid={uid} showToast={showToast} onSignOut={onSignOut} />
      break
    default:
      content = <PlaceholderScreen title="建设中" showToast={showToast} />
  }

  const bare = view === 'entry'

  return (
    <div id="shell">
      {content}
      {!bare && <TabBar view={view} onChange={goto} />}
      {!bare && (
        <button type="button" className="fab" aria-label="记一餐" onClick={() => openEntry({ date: todayStr() })}>
          <i className="fa-solid fa-plus" aria-hidden="true" />
        </button>
      )}
      <Toast toast={toast} />
    </div>
  )
}
