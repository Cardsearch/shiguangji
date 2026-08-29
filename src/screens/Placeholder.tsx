import type { ShowToast } from '../components/Toast'

interface Props {
  title: string
  showToast: ShowToast
  onBack?: () => void
  onSignOut?: () => void
}

/** 里程碑过渡占位屏（M3+ 逐一替换为真实页面） */
export default function PlaceholderScreen({ title, showToast, onBack, onSignOut }: Props) {
  return (
    <div className="screen no-tab">
      {onBack && (
        <button type="button" className="icon-btn" aria-label="返回" onClick={onBack}>
          <i className="fa-solid fa-chevron-left" />
        </button>
      )}
      <div className="empty-hero">
        <div className="brand-name">{title}</div>
        <p className="muted" style={{ marginTop: 8 }}>
          本阶段占位 · 下一里程碑实现
        </p>
        <button
          type="button"
          className="btn ghost sm"
          style={{ marginTop: 14 }}
          onClick={() => showToast('原型流程已打通')}
        >
          测试轻提示
        </button>
        {onSignOut && (
          <div style={{ marginTop: 14 }}>
            <button type="button" className="btn primary sm" onClick={onSignOut}>
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
              退出登录
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
