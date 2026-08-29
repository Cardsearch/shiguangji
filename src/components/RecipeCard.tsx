import type { Recipe } from '../types'

export default function RecipeCard({
  recipe,
  onRecord,
  onFavorite,
  busy,
}: {
  recipe: Recipe
  onRecord: () => void
  onFavorite: () => void
  busy?: boolean
}) {
  return (
    <div className="bubble recipe">
      <div className="rp-head">
        <b>{recipe.name}</b>
        <span className="rp-kcal">约 {recipe.kcal} kcal</span>
      </div>
      <p className="rp-label">食材</p>
      <div className="rp-ing">
        {recipe.ingredients.slice(0, 8).map((i, idx) => (
          <span key={`${i}-${idx}`}>{i}</span>
        ))}
      </div>
      <p className="rp-label">步骤</p>
      <ol className="rp-steps">
        {recipe.steps.slice(0, 5).map((s, idx) => (
          <li key={`${s}-${idx}`}>{s}</li>
        ))}
      </ol>
      <div className="rp-acts">
        <button type="button" className="btn primary" disabled={busy} onClick={onRecord}>
          <i className="fa-solid fa-check" aria-hidden="true" />
          {busy ? '记录中…' : '记录这餐'}
        </button>
        <button type="button" className="btn ghost" onClick={onFavorite}>
          <i className="fa-regular fa-bookmark" aria-hidden="true" />
          收藏
        </button>
      </div>
      <p className="rp-note">热量为 AI 估算，仅供参考</p>
    </div>
  )
}
