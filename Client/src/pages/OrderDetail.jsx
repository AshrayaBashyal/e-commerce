import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as ordersApi from '../api/orders'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'

const CANCELLABLE = ['PENDING', 'PROCESSING']

export default function OrderDetail() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)

  const load = () => {
    setLoading(true)
    ordersApi
      .getOrder(id)
      .then(({ data }) => setOrder(data))
      .catch(() => setError('This order could not be found.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [id])

  const handleCancel = async () => {
    setCancelling(true)
    try {
      await ordersApi.cancelOrder(id)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Could not cancel this order.')
    } finally {
      setCancelling(false)
    }
  }

  if (loading) return <Spinner />
  if (error && !order) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
      </div>
    )
  }
  if (!order) return null

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <h1>Order #{order.id}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <StatusBadge status={order.status} />
          <StatusBadge status={order.payment_status} />
        </div>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id}>
                <td>{item.product_name}</td>
                <td className="tabular">{item.quantity}</td>
                <td className="tabular">${Number(item.unit_price).toFixed(2)}</td>
                <td className="tabular">${Number(item.subtotal).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="cart-summary panel" style={{ marginTop: 16 }}>
        <div className="total-row" style={{ paddingTop: 0, borderTop: 'none' }}>
          <span>Total</span>
          <span className="tabular">${Number(order.total_amount).toFixed(2)}</span>
        </div>
      </div>

      {CANCELLABLE.includes(order.status) && (
        <button className="btn btn-danger" style={{ marginTop: 20 }} onClick={handleCancel} disabled={cancelling}>
          {cancelling ? 'Cancelling…' : 'Cancel order'}
        </button>
      )}
    </div>
  )
}
