import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import type { ShowToast } from '../components/Toast'
import { loadProfile, saveProfile, type ProfileDoc } from '../lib/repos/profile'
import { validateUsername } from '../lib/authRules'

interface Props {
  uid: string
  showToast: ShowToast
  onSignOut: () => void
}

export default function SettingsScreen({ uid, showToast, onSignOut }: Props) {
  const [profile, setProfile] = useState<ProfileDoc | null>(null)
  const [nickname, setNickname] = useState('')
  const [target, setTarget] = useState('1800')
  const [vegetarian, setVegetarian] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadProfile(uid)
      .then(p => {
        setProfile(p)
        setNickname(p.nickname)
        setTarget(String(p.dailyTargetKcal))
        setVegetarian(p.vegetarian)
      })
      .catch(() => setError('档案加载失败，请刷新重试'))
  }, [uid])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy) return
    const nick = nickname.trim()
    if (nick) {
      const uErr = validateUsername(nick)
      if (uErr) {
        setError(uErr)
        return
      }
    }
    const t = Number(target)
    if (!Number.isFinite(t) || t < 800 || t > 6000) {
      setError('热量目标需在 800–6000 kcal 之间')
      return
    }
    setError(null)
    setBusy(true)
    try {
      await saveProfile(uid, profile?.docId ?? null, { nickname: nick, dailyTargetKcal: Math.round(t), vegetarian })
      showToast('设置已保存')
    } catch (err) {
      showToast(err instanceof Error ? err.message : '保存失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="screen no-tab">
      <div className="sheet-head">
        <h3>我的 · 设置</h3>
        <span className="date-chip mono">{uid.slice(0, 12)}…</span>
      </div>

      {error && (
        <div className="form-error" role="alert">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="set-card">
          <h3>
            <i className="fa-solid fa-user-gear" aria-hidden="true" />
            个人资料
          </h3>
          <div className="field">
            <label htmlFor="set-nickname">
              昵称 <small>主页问候语使用</small>
            </label>
            <div className="inp">
              <i className="fa-regular fa-user" aria-hidden="true" />
              <input
                id="set-nickname"
                value={nickname}
                maxLength={20}
                placeholder="如：阿禾"
                onChange={e => setNickname(e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="set-target">
              每日热量目标 <small>kcal，800–6000</small>
            </label>
            <div className="inp">
              <i className="fa-solid fa-fire-flame-curved" aria-hidden="true" />
              <input
                id="set-target"
                inputMode="numeric"
                value={target}
                onChange={e => setTarget(e.target.value.replace(/[^\d]/g, ''))}
              />
            </div>
          </div>
        </div>

        <div className="set-card">
          <h3>
            <i className="fa-solid fa-leaf" aria-hidden="true" />
            饮食偏好
          </h3>
          <div className="set-row">
            <span>
              素食
              <small style={{ display: 'block', color: 'var(--ink-soft)', fontSize: 11 }}>
                开启后「来一餐」只抽素食菜
              </small>
            </span>
            <button
              type="button"
              className={`diet-chip ${vegetarian ? 'on' : ''}`}
              aria-pressed={vegetarian}
              onClick={() => setVegetarian(v => !v)}
            >
              {vegetarian ? '已开启' : '未开启'}
            </button>
          </div>
        </div>

        <button className="btn primary block" type="submit" disabled={busy}>
          {busy ? '保存中…' : (
            <>
              <i className="fa-solid fa-check" aria-hidden="true" />
              保存设置
            </>
          )}
        </button>
      </form>

      <div className="set-card" style={{ marginTop: 16 }}>
        <h3>
          <i className="fa-solid fa-shield-halved" aria-hidden="true" />
          账号
        </h3>
        <button type="button" className="btn ghost block" onClick={onSignOut}>
          <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
          退出登录
        </button>
      </div>
    </div>
  )
}
