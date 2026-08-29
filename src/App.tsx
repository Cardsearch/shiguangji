import { useEffect, useState } from 'react'
import AppShell from './AppShell'
import { getSession, signOut } from './lib/auth'
import AuthScreen from './screens/AuthScreen'

export default function App() {
  const [session, setSession] = useState<{ uid: string } | null>(null)
  const [booting, setBooting] = useState(true)

  useEffect(() => {
    let alive = true
    getSession().then(s => {
      if (!alive) return
      setSession(s)
      setBooting(false)
    })
    return () => {
      alive = false
    }
  }, [])

  if (booting) {
    return (
      <div id="shell">
        <div className="boot-screen">
          <div className="spin" aria-hidden="true" />
          <div className="brand-slogan">正在进入食光记…</div>
        </div>
      </div>
    )
  }

  if (!session) {
    return (
      <div id="shell">
        <AuthScreen onSignedIn={uid => setSession({ uid })} />
      </div>
    )
  }

  return (
    <AppShell
      uid={session.uid}
      onSignOut={() => {
        void signOut().finally(() => setSession(null))
      }}
    />
  )
}
