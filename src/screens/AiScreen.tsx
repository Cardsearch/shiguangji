import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import RecipeCard from '../components/RecipeCard'
import type { ShowToast } from '../components/Toast'
import { askRecipe } from '../lib/ai'
import { addRecord } from '../lib/repos/records'
import { mealNow, todayStr } from '../lib/date'
import { MEAL_LABEL, type Recipe } from '../types'
import type { View } from '../views'

interface ChatMsg {
  id: number
  role: 'user' | 'assistant'
  kind: 'text' | 'recipe' | 'typing' | 'error'
  text?: string
  recipe?: Recipe
}

const QUICK_PROMPTS = ['低卡晚餐怎么搭配', '高蛋白早餐推荐', '冰箱剩菜一锅出'] as const
const WELCOME =
  '你好呀！告诉我你冰箱里有什么、想花多少时间，我来帮你搭配一餐。比如："冰箱有鸡蛋、番茄和米饭，10 分钟能做什么？"'

let nextId = 1

export default function AiScreen({ uid, showToast, goto }: { uid: string; showToast: ShowToast; goto: (v: View) => void }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([{ id: nextId++, role: 'assistant', kind: 'text', text: WELCOME }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [degraded, setDegraded] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const chatRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = chatRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [msgs])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    setBusy(true)
    setDegraded(false)
    const typingId = nextId++
    setMsgs(prev => [
      ...prev,
      { id: nextId++, role: 'user', kind: 'text', text: content },
      { id: typingId, role: 'assistant', kind: 'typing' },
    ])
    setInput('')

    // 组装对话历史（保持简短：食谱只留名字）
    const history: Array<{ role: 'user' | 'assistant'; content: string }> = []
    for (const m of msgs) {
      if (m.kind === 'text' && m.text) history.push({ role: m.role, content: m.text })
      else if (m.kind === 'recipe' && m.recipe) history.push({ role: 'assistant', content: `我推荐过「${m.recipe.name}」` })
    }
    history.push({ role: 'user', content })

    const res = await askRecipe(history)
    setMsgs(prev =>
      prev.map(m => {
        if (m.id !== typingId) return m
        if (res.kind === 'recipe') return { ...m, kind: 'recipe', recipe: res.recipe }
        if (res.kind === 'text') return { ...m, kind: 'text', text: res.text }
        return { ...m, kind: 'error', text: res.message }
      }),
    )
    if (res.kind === 'error' && !res.transient) setDegraded(true)
    setBusy(false)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  async function recordRecipe(recipe: Recipe, msgId: number) {
    if (savingId !== null) return
    setSavingId(msgId)
    try {
      await addRecord(uid, {
        date: todayStr(),
        mealType: mealNow(),
        name: recipe.name,
        qty: 1,
        unit: '份',
        kcal: recipe.kcal,
        note: '',
        source: 'ai',
      })
      showToast(`已记到${MEAL_LABEL[mealNow()]}`)
      goto('home')
    } catch (e) {
      showToast(e instanceof Error ? e.message : '记录失败，请重试')
      setSavingId(null)
    }
  }

  return (
    <div className="ai-wrap">
      <header className="app-head ai-head">
        <span className="ai-ava" aria-hidden="true">
          <i className="fa-solid fa-robot" />
        </span>
        <div style={{ flex: 1 }}>
          <h2 className="greet" style={{ fontSize: 21 }}>
            食光 AI
          </h2>
          <p className="eyebrow">问食材 · 问做法 · 问搭配</p>
        </div>
      </header>

      {degraded && (
        <div className="ai-degraded" role="alert">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          <span>
            AI 暂不可用，稍后可重试；急着决定的话，先去
            <button type="button" onClick={() => goto('random')}>
              来一餐
            </button>
            抽一个。
          </span>
        </div>
      )}

      <div className="chat" ref={chatRef} aria-live="polite">
        {msgs.map(m => (
          <div key={m.id} className={`msg ${m.role}`}>
            {m.role === 'assistant' && (
              <span className="msg-ava" aria-hidden="true">
                <i className="fa-solid fa-robot" />
              </span>
            )}
            {m.kind === 'typing' && (
              <div className="bubble typing" aria-label="AI 正在思考">
                <i />
                <i />
                <i />
              </div>
            )}
            {m.kind === 'text' && <div className="bubble">{m.text}</div>}
            {m.kind === 'error' && <div className="bubble">{m.text}</div>}
            {m.kind === 'recipe' && m.recipe && (
              <RecipeCard
                recipe={m.recipe}
                busy={savingId === m.id}
                onRecord={() => void recordRecipe(m.recipe as Recipe, m.id)}
                onFavorite={() => showToast('收藏功能即将上线')}
              />
            )}
          </div>
        ))}
      </div>

      <div className="chat-foot">
        <div className="qchips">
          {QUICK_PROMPTS.map(q => (
            <button type="button" key={q} className="qchip" disabled={busy} onClick={() => void send(q)}>
              {q}
            </button>
          ))}
        </div>
        <form className="chat-inp" onSubmit={handleSubmit}>
          <input
            aria-label="问 AI 吃什么"
            placeholder="问我吃什么…"
            value={input}
            maxLength={200}
            onChange={e => setInput(e.target.value)}
          />
          <button type="submit" className="send" aria-label="发送" disabled={busy}>
            <i className="fa-solid fa-paper-plane" />
          </button>
        </form>
      </div>
    </div>
  )
}
