import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as ordersApi from '../api/orders'
import * as paymentsApi from '../api/payments'
import { useCart } from '../context/CartContext'
import Spinner from '../components/Spinner'

export default function Checkout() {
  const { cart, refreshCart } = useCart()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true

    const run = async () => {
      try {
        const { data: order } = await ordersApi.createOrder()
        const { data: session } = await paymentsApi.createCheckoutSession(order.id)
        // Stripe's redirect back doesn't necessarily carry our order id, so
        // stash it here for the success/cancel pages to pick up and poll.
        sessionStorage.setItem('xcart_pending_order', String(order.id))
        await refreshCart()
        window.location.href = session.checkout_url
      } catch (err) {
        setError(err.response?.data?.error || 'Could not start checkout. Your cart has not been charged.')
      }
    }
    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (error) {
    return (
      <div className="page page-narrow">
        <div className="error-banner">{error}</div>
        <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={() => navigate('/cart')}>
          Back to cart
        </button>
      </div>
    )
  }

  if (!cart) return <Spinner />

  return (
    <div className="page page-narrow">
      <div className="steps">
        <div className="step">
          <span className="step-num">1</span> Cart
        </div>
        <div className="step active">
          <span className="step-num">2</span> Payment
        </div>
        <div className="step">
          <span className="step-num">3</span> Confirm
        </div>
      </div>
      <Spinner />
      <p style={{ textAlign: 'center', color: 'var(--ink-muted)' }}>Taking you to secure payment…</p>
    </div>
  )
}
