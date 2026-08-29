import { useState } from 'react'
import type { FormEvent } from 'react'
import { signIn, signUp, type AuthResult } from '../lib/auth'
import { validateConfirm, validatePassword, validateUsername } from '../lib/authRules'

type Mode = 'login' | 'register'

export default function AuthScreen({ onSignedIn }: { onSignedIn: (uid: string) => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const fail = (msg: string) => {
      setError(msg)
      return false
    }
    const uErr = validateUsername(username)
    if (uErr) return fail(uErr)
    const pErr = validatePassword(password)
    if (pErr) return fail(pErr)
    if (mode === 'register') {
      const cErr = validateConfirm(password, confirm)
      if (cErr) return fail(cErr)
    }
    setError(null)
    setBusy(true)
    try {
      const res: AuthResult = mode === 'login' ? await signIn(username.trim(), password) : await signUp(username.trim(), password)
      if (res.ok) onSignedIn(res.uid)
      else setError(res.message)
    } finally {
      setBusy(false)
    }
  }

  function switchMode(m: Mode) {
    setMode(m)
    setError(null)
  }

  return (
    <div className="auth-wrap" style={{ padding: '56px 24px 28px' }}>
      <div className="brand">
        <div className="brand-mark" aria-hidden="true">
          <i className="fa-solid fa-utensils" />
        </div>
        <h1 className="brand-name">食光记</h1>
        <p className="brand-slogan">好好吃饭 · 天天记得</p>
      </div>

      <div className="seg" role="tablist" aria-label="登录或注册">
        <button type="button" className={`seg-btn ${mode === 'login' ? 'on' : ''}`} onClick={() => switchMode('login')}>
          登 录
        </button>
        <button type="button" className={`seg-btn ${mode === 'register' ? 'on' : ''}`} onClick={() => switchMode('register')}>
          注 册
        </button>
      </div>

      {mode === 'register' && (
        <div className="reg-hint">
          <i className="fa-solid fa-circle-info" aria-hidden="true" />
          <span>注册成功将自动登录，并带你完成第一餐记录。</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        {error && (
          <div className="form-error" role="alert">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-username">用户名</label>
          <div className="inp">
            <i className="fa-regular fa-user" aria-hidden="true" />
            <input
              id="auth-username"
              type="text"
              autoComplete="username"
              placeholder="2–20 个字符"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="auth-password">密码</label>
          <div className="inp">
            <i className="fa-solid fa-lock" aria-hidden="true" />
            <input
              id="auth-password"
              type="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              placeholder="至少 8 位，含字母和数字"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
        </div>
        {mode === 'register' && (
          <div className="field">
            <label htmlFor="auth-confirm">确认密码</label>
            <div className="inp">
              <i className="fa-solid fa-lock" aria-hidden="true" />
              <input
                id="auth-confirm"
                type="password"
                autoComplete="new-password"
                placeholder="再输入一次"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
            </div>
          </div>
        )}
        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? '请稍候…' : mode === 'login' ? '登 录' : '创建账号'}
        </button>
      </form>
      <p className="fine">登录即代表同意 《用户协议》 与 《隐私政策》</p>
    </div>
  )
}
