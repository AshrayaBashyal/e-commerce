import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ page, count, pageSize = 10, hasNext, hasPrevious, onPrev, onNext }) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize))
  if (totalPages <= 1) return null

  return (
    <div className="pagination">
      <button className="btn btn-ghost btn-sm" onClick={onPrev} disabled={!hasPrevious}>
        <ChevronLeft size={16} /> Previous
      </button>
      <span className="tabular">
        Page {page} of {totalPages}
      </span>
      <button className="btn btn-ghost btn-sm" onClick={onNext} disabled={!hasNext}>
        Next <ChevronRight size={16} />
      </button>
    </div>
  )
}
