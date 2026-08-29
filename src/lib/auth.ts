import { app, auth } from './cloudbase'

export interface SessionInfo {
  uid: string
}

export type AuthResult = { ok: true; uid: string } | { ok: false; message: string }

interface ErrorLike {
  message?: unknown
}

function messageOf(e: unknown): string {
  const m = (e as ErrorLike | null | undefined)?.message
  return typeof m === 'string' ? m : ''
}

/** 登录失败统一提示，不泄露具体哪个错（PRD 3.1） */
function friendlySignInError(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed && trimmed.length <= 60) return trimmed
  return '操作失败，请稍后重试'
}

interface SessionUser {
  id?: unknown
  is_anonymous?: unknown
}

interface SessionShape {
  user?: SessionUser
}

/** 用 getSession() 判断真实登录态（不能用已废弃的 getLoginState） */
export async function getSession(): Promise<SessionInfo | null> {
  try {
    const { data } = await auth.getSession()
    const session = (data as { session?: SessionShape } | null)?.session
    if (!session) return null
    if (session.user?.is_anonymous === true) return null
    const uid = session.user?.id
    if (typeof uid !== 'string' || !uid) return null
    return { uid }
  } catch {
    return null
  }
}

interface BridgeOk {
  ok: true
  ticket: unknown
}
interface BridgeErr {
  ok: false
  message: unknown
}

function isBridgeResult(r: unknown): r is BridgeOk | BridgeErr {
  return typeof r === 'object' && r !== null && 'ok' in (r as Record<string, unknown>)
}

/** 用云函数签发的自定义登录 ticket 换取真实会话 */
async function ticketSignIn(ticket: string): Promise<AuthResult> {
  await auth.signInWithCustomTicket(async () => ticket)
  const s = await getSession()
  return s ? { ok: true, uid: s.uid } : { ok: false, message: '登录态获取失败，请重试' }
}

async function bridgeCall(action: 'register' | 'login', username: string, password: string): Promise<AuthResult> {
  const res = await app.callFunction({
    name: 'auth-bridge',
    data: { action, username: username.trim(), password },
  })
  const r: unknown = (res as { result?: unknown }).result
  if (!isBridgeResult(r)) return { ok: false, message: '服务返回异常，请稍后重试' }
  if (!r.ok) {
    const msg = typeof r.message === 'string' ? r.message : ''
    return { ok: false, message: friendlySignInError(msg) }
  }
  if (typeof r.ticket !== 'string' || !r.ticket) return { ok: false, message: '登录凭签发异常，请重试' }
  return ticketSignIn(r.ticket)
}

export async function signIn(username: string, password: string): Promise<AuthResult> {
  try {
    return await bridgeCall('login', username, password)
  } catch (e) {
    return { ok: false, message: friendlySignInError(messageOf(e)) }
  }
}

/** 用户名注册：走 auth-bridge 云函数（客户端 signUp 仅支持邮箱/手机号） */
export async function signUp(username: string, password: string): Promise<AuthResult> {
  try {
    return await bridgeCall('register', username, password)
  } catch (e) {
    const msg = messageOf(e)
    const m = msg.toLowerCase()
    if (m.includes('exist') || m.includes('taken') || m.includes('duplicate') || m.includes('already')) {
      return { ok: false, message: '该用户名已被注册' }
    }
    return { ok: false, message: friendlySignInError(msg) }
  }
}

export async function signOut(): Promise<void> {
  await auth.signOut()
}
