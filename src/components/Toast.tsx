import { useEffect, useState } from 'react'

export type ShowToast = (text: string) => void

/** 轻提示：内容由 AppShell 统一管理 */
export default function Toast({ toast }: { toast: { text: string; key: number } | null }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = window.setTimeout(() => setVisible(false), 1800)
    return () => window.clearTimeout(t)
  }, [toast])

  return (
    <div className={`toast ${visible ? 'show' : ''}`} role="status" aria-live="polite">
      {toast?.text ?? ''}
    </div>
  )
}
