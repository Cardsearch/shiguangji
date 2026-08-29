import { fmtTime } from '../lib/date'
import type { FoodRecord } from '../types'

/** 份量的友好展示：1 份 / 2 个 / 1.5 碗 */
export function fmtQty(r: FoodRecord): string {
  const q = Number.isInteger(r.qty) ? String(r.qty) : r.qty.toFixed(1).replace(/\.0$/, '')
  return `${q} ${r.unit}`
}

export default function ReceiptRow({
  record,
  onEdit,
  onDelete,
}: {
  record: FoodRecord
  onEdit: (r: FoodRecord) => void
  onDelete: (r: FoodRecord) => void
}) {
  const monogram = record.name.slice(0, 1)
  return (
    <div className="rc">
      <span className={`rc-mono m-${record.mealType}`} aria-hidden="true">
        {monogram}
      </span>
      <div className="rc-body">
        <b>{record.name}</b>
        <span className="rc-meta">
          {fmtQty(record)} · {fmtTime(record.createdAt)}
          {record.note ? ` · ${record.note}` : ''}
        </span>
      </div>
      <div className="rc-right">
        <b>
          {record.kcal.toLocaleString()}
          <i>kcal</i>
        </b>
        <span className="rc-act">
          <button type="button" aria-label={`编辑${record.name}`} onClick={() => onEdit(record)}>
            <i className="fa-regular fa-pen-to-square" />
          </button>
          <button type="button" aria-label={`删除${record.name}`} onClick={() => onDelete(record)}>
            <i className="fa-regular fa-trash-can" />
          </button>
        </span>
      </div>
    </div>
  )
}
