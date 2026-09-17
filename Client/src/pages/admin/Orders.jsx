import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as ordersApi from '../../api/orders'
import StatusBadge from '../../components/StatusBadge'
import Pagination from '../../components/Pagination'
import Spinner from '../../components/Spinner'

const TRANSITIONS = {
  PENDING: ['CANCELLED'],
  PROCESSING: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
}

const STATUS_FILTERS = ['', 'PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function AdminOrders() {
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    const params = { page }
    ordersApi
      .listOrders(params)
      .then(({ data }) => setResult(data))
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  const handleStatusChange = async (order, newStatus) => {
    if (!newStatus) return
    setUpdatingId(order.id)
    setError('')
    try {
      await ordersApi.updateOrderStatus(order.id, newStatus)
      load()
    } catch (err) {
      setError(err.response?.data?.error || `Could not move order #${order.id} to ${newStatus}.`)
    } finally {
      setUpdatingId(null)
    }
  }

  const visibleOrders = statusFilter
    ? (result?.results || []).filter((o) => o.status === statusFilter)
    : result?.results || []

  if (loading && !result) return <Spinner />

  return (
    <div className="page">
      <div className="toolbar">
        <h1>Manage orders</h1>
        <select className="input" style={{ maxWidth: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          {STATUS_FILTERS.map((s) => (
            <option key={s} value={s}>{s || 'All statuses'}</option>
          ))}
        </select>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {result && (
        <>
          <div className="panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Update status</th>
                </tr>
              </thead>
              <tbody>
                {visibleOrders.map((o) => {
                  const options = TRANSITIONS[o.status] || []
                  return (
                    <tr key={o.id}>
                      <td><Link to={`/orders/${o.id}`}>#{o.id}</Link></td>
                      <td>{o.user_email}</td>
                      <td><StatusBadge status={o.status} /></td>
                      <td><StatusBadge status={o.payment_status} /></td>
                      <td className="tabular">${Number(o.total_amount).toFixed(2)}</td>
                      <td>
                        {options.length > 0 ? (
                          <select
                            className="input"
                            style={{ maxWidth: 180 }}
                            value=""
                            disabled={updatingId === o.id}
                            onChange={(e) => handleStatusChange(o, e.target.value)}
                          >
                            <option value="">Move to…</option>
                            {options.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <span className="label">Terminal</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            count={result.count}
            hasNext={!!result.next}
            hasPrevious={!!result.previous}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  )
}
