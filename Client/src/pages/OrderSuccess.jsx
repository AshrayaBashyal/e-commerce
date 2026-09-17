import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import * as ordersApi from '../api/orders'
import StatusBadge from '../components/StatusBadge'
import Spinner from '../components/Spinner'

const POLL_MS = 3000

export default function OrderSuccess() {
  const [searchParams] = useSearchParams()
  const [order, setOrder] = useState(null)
  const [error, setError] = useState('')

  const orderId = searchParams.get('order_id') || sessionStorage.getItem('xcart_pending_order')

  useEffect(() => {
    if (!orderId) {
      setError('We could not tell which order this payment was for. Check your order history.')
      return
    }

    let cancelled = false
    let timer

    const poll = async () => {
      try {
        const { data } = await ordersApi.getOrder(orderId)
        if (cancelled) return
        setOrder(data)
        if (data.payment_status === 'PENDING') {
          timer = setTimeout(poll, POLL_MS)
        } else {
          sessionStorage.removeItem('xcart_pending_order')
        }
      } catch {
        if (!cancelled) setError('Could not check your order status. Refresh to try again.')
      }
    }
    poll()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [orderId])

  return (
    <div className="page page-narrow" style={{ textAlign: 'center' }}>
      {error && <div className="error-banner">{error}</div>}

      {!error && !order && (
        <>
          <Spinner />
          <p style={{ color: 'var(--ink-muted)' }}>Processing your payment…</p>
        </>
      )}

      {order && order.payment_status === 'PENDING' && (
        <>
          <Spinner />
          <p style={{ color: 'var(--ink-muted)' }}>Processing your payment…</p>
        </>
      )}

      {order && order.payment_status === 'PAID' && (
        <>
          <h1>Payment confirmed</h1>
          <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>
            Order #{order.id} is now <StatusBadge status={order.status} />.
          </p>
          <Link to={`/orders/${order.id}`} className="btn btn-primary" style={{ marginTop: 24 }}>
            View order
          </Link>
        </>
      )}

      {order && order.payment_status === 'FAILED' && (
        <>
          <h1>Payment failed</h1>
          <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>
            Your payment for order #{order.id} did not go through. No charge was made.
          </p>
          <Link to="/cart" className="btn btn-primary" style={{ marginTop: 24 }}>
            Back to cart
          </Link>
        </>
      )}
    </div>
  )
}
