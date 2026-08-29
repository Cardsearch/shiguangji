export default function TicketCard({ consumed, target, count }: { consumed: number; target: number; count: number }) {
  const pct = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0
  const remaining = Math.max(0, target - consumed)
  const barPct = Math.min(100, Math.round((count / 6) * 100))
  return (
    <section className="ticket" aria-label="今日摄入汇总">
      <div className="tk-top">
        <span>今日摄入 · TODAY</span>
        <span>目标 {target.toLocaleString()} KCAL</span>
      </div>
      <div className="tk-main">
        <div className="tk-num">
          <b>{consumed.toLocaleString()}</b>
          <span>kcal</span>
        </div>
        <div
          className="donut"
          style={{ background: `conic-gradient(var(--tomato) 0 ${pct}%, var(--hair) ${pct}% 100%)` }}
          role="img"
          aria-label={`已完成 ${pct}%，剩余 ${remaining} 千卡`}
        >
          <div className="donut-in">
            <b>{pct}%</b>
            <span>剩 {remaining.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="tk-bars">
        <div className="bar-row">
          <span>记录进度</span>
          <div className="bar">
            <i style={{ width: `${barPct}%` }} />
          </div>
          <b>{count} 条</b>
        </div>
      </div>
    </section>
  )
}
