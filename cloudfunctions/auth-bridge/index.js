/**
 * auth-bridge：用户名+密码注册/登录的自定义登录桥接
 * 背景：Web SDK v3 客户端 signUp 仅支持邮箱/手机号，用户名注册按官方路径走
 * 「自有用户系统 + createTicket 自定义登录」。
 * 凭据存 user_credentials 集合（ADMINONLY，仅本函数读写），ticket 用自定义登录密钥签发。
 * 自定义登录凭据必须包含 env_id（node-sdk 会校验）。
 */
const tcb = require('@cloudbase/node-sdk')
const crypto = require('node:crypto')

const KEY_ID = process.env.TCB_CUSTOM_KEY_ID
const PRIVATE_KEY = process.env.TCB_CUSTOM_PRIVATE_KEY
const ENV_ID = process.env.TCB_ENV_ID

if (!KEY_ID || !PRIVATE_KEY || !ENV_ID) {
  console.error('auth-bridge 缺少 TCB_CUSTOM_KEY_ID / TCB_CUSTOM_PRIVATE_KEY / TCB_ENV_ID 环境变量')
}

const app = tcb.init({
  env: ENV_ID || tcb.SYMBOL_CURRENT_ENV,
  credentials: { env_id: ENV_ID, private_key_id: KEY_ID, private_key: PRIVATE_KEY },
})
const authMgmt = app.auth()
const db = app.database()

// 与前端 authRules 同一套规则的服务端副本（服务端校验不可省）
const USERNAME_RE = /^[\u4e00-\u9fa5A-Za-z0-9_-]{2,20}$/

function validateUsername(u) {
  return typeof u === 'string' && USERNAME_RE.test(u)
}
function validatePassword(p) {
  return typeof p === 'string' && p.length >= 8 && /[a-zA-Z]/.test(p) && /[0-9]/.test(p)
}
function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString('hex')
}
// customUserId 仅允许 ASCII 字符且 4-32 位，与用户名解耦：sg_<sha1 前 20 位>
function customIdOf(uname) {
  return 'sg_' + crypto.createHash('sha1').update(uname).digest('hex').slice(0, 20)
}

function createTicketSafe(customUserId) {
  try {
    return authMgmt.createTicket(customUserId, { refresh: 3600 * 1000 })
  } catch (e) {
    console.error('createTicket failed:', e && e.message)
    return null
  }
}

async function handleRegister(event) {
  const username = typeof event.username === 'string' ? event.username.trim() : ''
  const password = typeof event.password === 'string' ? event.password : ''
  if (!validateUsername(username)) return { ok: false, message: '用户名需 2-20 个字符' }
  if (!validatePassword(password)) return { ok: false, message: '密码至少 8 位，需包含字母和数字' }

  const uname = username.toLowerCase()
  const exist = await db.collection('user_credentials').where({ uname }).count()
  if (exist && typeof exist.total === 'number' && exist.total > 0) {
    return { ok: false, message: '该用户名已被注册' }
  }

  const salt = crypto.randomBytes(16).toString('hex')
  const customUserId = customIdOf(uname)
  // 先签 ticket 再落库：落库失败时重试不会撞"已注册"，已签发的废弃 ticket 无害
  const ticket = createTicketSafe(customUserId)
  if (!ticket) return { ok: false, message: '登录凭签发失败，请稍后重试' }

  await db.collection('user_credentials').add({
    uname,
    username,
    salt,
    passwordHash: hashPassword(password, salt),
    customUserId,
    createdAt: Date.now(),
  })
  return { ok: true, ticket }
}

async function handleLogin(event) {
  const username = typeof event.username === 'string' ? event.username.trim() : ''
  const password = typeof event.password === 'string' ? event.password : ''
  if (!username || !password) return { ok: false, message: '用户名或密码不正确' }

  const uname = username.toLowerCase()
  const found = await db.collection('user_credentials').where({ uname }).limit(1).get()
  const doc = found && Array.isArray(found.data) ? found.data[0] : null
  const salt = doc && typeof doc.salt === 'string' ? doc.salt : null
  const stored = doc && typeof doc.passwordHash === 'string' ? doc.passwordHash : null
  const customUserId = doc && typeof doc.customUserId === 'string' ? doc.customUserId : null
  if (!doc || !salt || !stored || !customUserId) return { ok: false, message: '用户名或密码不正确' }

  const computed = crypto.scryptSync(password, salt, 64)
  const expected = Buffer.from(stored, 'hex')
  const same = computed.length === expected.length && crypto.timingSafeEqual(computed, expected)
  if (!same) return { ok: false, message: '用户名或密码不正确' }

  const ticket = createTicketSafe(customUserId)
  if (!ticket) return { ok: false, message: '登录凭签发失败，请稍后重试' }
  return { ok: true, ticket }
}

exports.main = async function main(event) {
  const action = event && event.action
  try {
    if (action === 'register') return await handleRegister(event)
    if (action === 'login') return await handleLogin(event)
    return { ok: false, message: '未知操作' }
  } catch (e) {
    console.error('auth-bridge error:', e && e.message)
    return { ok: false, message: '服务暂不可用，请稍后重试' }
  }
}
