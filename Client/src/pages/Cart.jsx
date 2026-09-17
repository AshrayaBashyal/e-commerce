import { useNavigate } from 'react-router-dom'
import { AlertTriangle, Trash2 } from 'lucide-react'
import { useCart } from '../context/CartContext'
import Spinner from '../components/Spinner'
import ProductThumb from '../components/ProductThumb'

export default function Cart() {
  const { cart, loading, updateItem, removeItem, clear } = useCart()
  const navigate = useNavigate()

  if (loading && !cart) return <Spinner />

  const items = cart?.items || []
  const hasUnavailable = items.some((i) => !i.is_available)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Your cart</h1>
        {items.length > 0 && (
          <button className="btn btn-ghost btn-sm" onClick={clear}>
            Clear cart
          </button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="empty-state">
          <h3>Your cart is empty</h3>
          <p>Browse the shop and add something you like.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <div className="panel">
            {items.map((item) => (
              <div className="cart-line" key={item.id}>
                <div className="thumb">
                  <ProductThumb name={item.product_name} fontSize="1rem" />
                </div>
                <div>
                  <p style={{ fontWeight: 600 }}>{item.product_name}</p>
                  <p className="label tabular">${Number(item.unit_price).toFixed(2)} each</p>
                  {!item.is_available && (
                    <p className="availability-warning">
                      <AlertTriangle size={14} /> No longer available at this quantity
                    </p>
                  )}
                </div>
                <div className="qty-stepper">
                  <button onClick={() => updateItem(item.id, Math.max(1, item.quantity - 1))} aria-label="Decrease quantity">−</button>
                  <span className="tabular">{item.quantity}</span>
                  <button onClick={() => updateItem(item.id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                </div>
                <p className="tabular" style={{ fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
                  ${Number(item.subtotal).toFixed(2)}
                </p>
                <button className="btn btn-ghost btn-sm" onClick={() => removeItem(item.id)} aria-label="Remove item">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="panel cart-summary">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="label">Subtotal</span>
              <span className="tabular">${Number(cart.total).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>Total</span>
              <span className="tabular">${Number(cart.total).toFixed(2)}</span>
            </div>
            {hasUnavailable && (
              <p className="availability-warning" style={{ marginTop: 0 }}>
                <AlertTriangle size={14} /> Resolve unavailable items before checking out
              </p>
            )}
            <button
              className="btn btn-primary"
              disabled={hasUnavailable}
              onClick={() => navigate('/checkout')}
            >
              Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
