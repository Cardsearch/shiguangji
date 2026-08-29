import { app } from './cloudbase'
import { isRecipe } from './recipe'
import type { Recipe } from '../types'

export interface ChatTurn {
  role: 'user' | 'assistant'
  content: string
}

export type AskResult =
  | { kind: 'recipe'; recipe: Recipe }
  | { kind: 'text'; text: string }
  | { kind: 'error'; message: string; transient?: boolean }

function messageOf(e: unknown): string {
  const m = (e as { message?: unknown } | null | undefined)?.message
  return typeof m === 'string' && m ? m : 'AI 调用失败，请稍后重试'
}

function callAi(data: Record<string, unknown>, timeoutMs: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error('AI 响应超时，请检查网络后重试')), timeoutMs)
    app
      .callFunction({ name: 'ai-proxy', data })
      .then(res => {
        clearTimeout(timer)
        resolve((res as { result?: unknown }).result)
      })
      .catch(e => {
        clearTimeout(timer)
        reject(e instanceof Error ? e : new Error('AI 调用失败，请稍后重试'))
      })
  })
}

/** 问答式食谱：返回结构化食谱卡 / 纯文本 / 错误（transient=true 表示限流等临时问题） */
export async function askRecipe(history: ChatTurn[]): Promise<AskResult> {
  try {
    const r = await callAi({ action: 'recipe', messages: history }, 30000)
    if (typeof r === 'object' && r !== null) {
      const o = r as Record<string, unknown>
      if (o.ok === true && isRecipe(o.recipe)) return { kind: 'recipe', recipe: o.recipe }
      if (o.ok === true && typeof o.text === 'string' && o.text.trim()) {
        return { kind: 'text', text: o.text }
      }
      if (o.ok === false && o.error === 'RATE_LIMIT') {
        return { kind: 'error', message: 'AI 这会儿太忙了（免费额度限流），等几秒再问～', transient: true }
      }
    }
    return { kind: 'error', message: 'AI 暂时开小差了，请重试' }
  } catch (e) {
    return { kind: 'error', message: messageOf(e) }
  }
}

/** 热量估算：失败返回 null（调用方降级到本地映射） */
export async function estimateKcal(name: string, qty: number, unit: string): Promise<number | null> {
  try {
    const r = await callAi({ action: 'estimateKcal', name, qty, unit }, 20000)
    if (typeof r === 'object' && r !== null) {
      const o = r as Record<string, unknown>
      if (o.ok === true && typeof o.kcal === 'number' && o.kcal > 0 && o.kcal <= 5000) return o.kcal
    }
    return null
  } catch {
    return null
  }
}
