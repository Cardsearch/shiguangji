/**
 * ai-proxy：AI 能力统一出口（成长计划免费额度仅限云函数/小程序 SDK 消耗，网页端必须经此中转）。
 * action=recipe      → 结构化食谱 JSON（hy3 文本模型）；非饮食问题返回闲聊文本
 * action=estimateKcal → 食物热量估算（返回整数 kcal）
 * 约束：hy3 免费额度有调用频率限制（429），此处统一做退避重试与错误分类。
 */
const tcb = require('@cloudbase/node-sdk')

const app = tcb.init({ env: tcb.SYMBOL_CURRENT_ENV })
const ai = app.ai() // node-sdk 中 ai 是方法，返回 AI 扩展实例
const authMgmt = app.auth()
const MODEL_ID = process.env.AI_MODEL_ID || 'hy3'

const SYSTEM_PROMPT =
  '你是「食光记」的饮食助手，帮助用户解决"今天吃什么"。你只输出一个 JSON 对象，' +
  '不要 markdown 代码块，不要任何解释文字。按以下规则二选一输出：\n' +
  '1) 用户在问食材、菜谱、三餐搭配等饮食相关问题时，输出：' +
  '{"name":"菜名","kcal":整数,"minutes":整数,"ingredients":["食材及用量"],"steps":["简要步骤"],"tags":["标签"]}，' +
  '标签从 家常/快手/低卡/高蛋白/素食/暖胃/清爽/早餐/主食 中选 1-3 个，kcal 为单人份总热量估算，步骤不超过 5 步；\n' +
  '2) 用户的问题与饮食无关（问你是谁、什么模型、闲聊等），输出：{"chat":"用一两句话简短友好地回答，并把话题引回今天吃什么"}。\n' +
  '始终使用简体中文。'

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function isRateLimitError(e) {
  const msg = String((e && e.message) || e)
  return msg.includes('429') || msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')
}

/** hy3 免费额度有频率限制：429 时退避重试（1 次 800ms + 1 次 1800ms） */
async function generateWithRetry(messages) {
  const model = ai.createModel('cloudbase')
  let lastErr = null
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await model.generateText({ model: MODEL_ID, messages })
      return { res, rateLimited: false }
    } catch (e) {
      lastErr = e
      if (isRateLimitError(e) && attempt < 2) {
        await sleep(attempt === 0 ? 800 : 1800)
        continue
      }
      break
    }
  }
  return { res: null, rateLimited: isRateLimitError(lastErr), lastErr }
}

function extractText(res) {
  if (typeof res === 'string') return res
  if (res && typeof res === 'object') {
    if (typeof res.text === 'string') return res.text
    const choice = Array.isArray(res.choices) ? res.choices[0] : null
    if (choice && choice.message && typeof choice.message.content === 'string') return choice.message.content
  }
  return ''
}

function extractJson(text) {
  if (typeof text !== 'string' || !text.trim()) return null
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence && fence[1]) t = fence[1].trim()
  const start = t.indexOf('{')
  const end = t.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null
  try {
    return JSON.parse(t.slice(start, end + 1))
  } catch (e) {
    return null
  }
}

function arrOfStr(v, max) {
  if (!Array.isArray(v)) return []
  return v.filter((x) => typeof x === 'string' && x.trim()).slice(0, max)
}

function toRecipe(j) {
  if (!j || typeof j !== 'object') return null
  const r = j
  if (typeof r.name !== 'string' || !r.name.trim()) return null
  const kcal = typeof r.kcal === 'number' && Number.isFinite(r.kcal) ? Math.round(r.kcal) : 0
  const ingredients = arrOfStr(r.ingredients, 15)
  const steps = arrOfStr(r.steps, 8)
  // kcal 或步骤缺失说明模型没按食谱格式回答，按无效处理
  if (kcal <= 0 || steps.length === 0) return null
  return {
    name: r.name.trim().slice(0, 30),
    kcal: Math.min(5000, kcal),
    minutes: typeof r.minutes === 'number' && Number.isFinite(r.minutes) ? Math.min(600, Math.max(1, Math.round(r.minutes))) : 15,
    ingredients,
    steps,
    tags: arrOfStr(r.tags, 3),
  }
}

async function handleRecipe(event) {
  const raw = Array.isArray(event.messages) ? event.messages : []
  const messages = raw
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content).slice(0, 500) }))
  if (messages.length === 0) return { ok: false, error: 'EMPTY' }

  const { res, rateLimited } = await generateWithRetry([
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ])
  if (!res) return { ok: false, error: rateLimited ? 'RATE_LIMIT' : 'AI_SERVICE' }

  const text = extractText(res)
  const j = extractJson(text)
  if (j && typeof j.chat === 'string' && j.chat.trim()) {
    return { ok: true, text: j.chat.trim().slice(0, 500) }
  }
  const recipe = toRecipe(j)
  if (recipe) return { ok: true, recipe }
  // 模型没有按格式输出：把原文作为普通回复透出，不生成垃圾食谱卡
  return { ok: true, text: text.slice(0, 500) || '这个问题我需要再想想，换个食材相关的问题试试？' }
}

async function handleEstimate(event) {
  const name = typeof event.name === 'string' ? event.name.trim().slice(0, 30) : ''
  const qty = typeof event.qty === 'number' && Number.isFinite(event.qty) ? event.qty : 1
  const unit = typeof event.unit === 'string' ? event.unit.slice(0, 6) : '份'
  if (!name) return { ok: false, error: 'EMPTY' }

  const { res, rateLimited } = await generateWithRetry([
    { role: 'user', content: `估算「${qty}${unit}${name}」的热量。只输出一个整数（kcal），不要任何其他内容。` },
  ])
  if (!res) return { ok: false, error: rateLimited ? 'RATE_LIMIT' : 'AI_SERVICE' }
  const n = parseInt((extractText(res).match(/\d+/) || [])[0], 10)
  if (!Number.isFinite(n) || n <= 0 || n > 5000) return { ok: false, error: 'PARSE' }
  return { ok: true, kcal: n }
}

exports.main = async function main(event) {
  // 函数安全规则是环境级的（auth-bridge 注册/登录必须匿名可调），
  // 因此 AI 配额保护在函数内做：无登录身份一律拒绝
  let callerUid = ''
  try {
    const info = authMgmt.getUserInfo()
    callerUid = typeof info.uid === 'string' ? info.uid : ''
  } catch (e) {
    callerUid = ''
  }
  if (!callerUid) return { ok: false, error: 'UNAUTHORIZED' }

  const action = event && event.action
  try {
    if (action === 'recipe') return await handleRecipe(event)
    if (action === 'estimateKcal') return await handleEstimate(event)
    return { ok: false, error: 'UNKNOWN_ACTION' }
  } catch (e) {
    console.error('ai-proxy error:', e && e.message)
    return { ok: false, error: 'AI_SERVICE' }
  }
}
