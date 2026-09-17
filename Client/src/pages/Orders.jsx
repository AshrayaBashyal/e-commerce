import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as ordersApi from '../api/orders'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function Orders() {
  const { user } = useAuth()
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    ordersApi
      .listOrders({ page })
      .then(({ data }) => setResult(data))
      .catch(() => setError('Could not load orders.'))
      .finally(() => setLoading(false))
  }, [page])

  if (loading && !result) return <Spinner />

  return (
    <div className="page">
      <div className="page-header">
        <h1>{user?.is_staff ? 'All orders' : 'Your orders'}</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {result && result.results.length === 0 ? (
        <div className="empty-state">
          <h3>No orders yet</h3>
          <p>Once you check out, your orders will show up here.</p>
        </div>
      ) : (
        result && (
          <>
            <div className="panel">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order</th>
                    {user?.is_staff && <th>Customer</th>}
                    <th>Status</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {result.results.map((o) => (
                    <tr key={o.id}>
                      <td><Link to={`/orders/${o.id}`}>#{o.id}</Link></td>
                      {user?.is_staff && <td>{o.user_email}</td>}
                      <td><StatusBadge status={o.status} /></td>
                      <td><StatusBadge status={o.payment_status} /></td>
                      <td className="tabular">${Number(o.total_amount).toFixed(2)}</td>
                      <td>{new Date(o.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
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
        )
      )}
    </div>
  )
}
