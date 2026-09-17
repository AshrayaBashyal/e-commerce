import { Link } from 'react-router-dom'

export default function OrderCancel() {
  return (
    <div className="page page-narrow" style={{ textAlign: 'center' }}>
      <h1>Checkout cancelled</h1>
      <p style={{ marginTop: 8, color: 'var(--ink-muted)' }}>
        Nothing was charged. Your cart is still saved.
      </p>
      <Link to="/cart" className="btn btn-primary" style={{ marginTop: 24 }}>
        Back to cart
      </Link>
    </div>
  )
}
