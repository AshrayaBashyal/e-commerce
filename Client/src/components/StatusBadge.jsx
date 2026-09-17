const STATUS_STYLE = {
  PENDING: 'pill-muted',
  PROCESSING: 'pill-muted',
  SHIPPED: 'pill-accent',
  DELIVERED: 'pill-accent',
  CANCELLED: 'pill-danger',
  PAID: 'pill-accent',
  FAILED: 'pill-danger',
}

export default function StatusBadge({ status }) {
  const cls = STATUS_STYLE[status] || 'pill-muted'
  return <span className={`pill ${cls}`}>{status}</span>
}
