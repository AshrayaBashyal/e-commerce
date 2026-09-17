import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import * as productsApi from '../api/products'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import ProductThumb from '../components/ProductThumb'
import Spinner from '../components/Spinner'
import Toast from '../components/Toast'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { addItem } = useCart()

  const [product, setProduct] = useState(null)
  const [recs, setRecs] = useState([])
  const [activeImage, setActiveImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError('')
    setActiveImage(0)
    setQuantity(1)
    productsApi
      .getProduct(id)
      .then(({ data }) => setProduct(data))
      .catch(() => setError('This product could not be found.'))
      .finally(() => setLoading(false))
    productsApi
      .getRecommendations(id)
      .then(({ data }) => setRecs(data))
      .catch(() => setRecs([]))
  }, [id])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 2200)
    return () => clearTimeout(t)
  }, [toast])

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } })
      return
    }
    setAdding(true)
    try {
      await addItem(product.id, quantity)
      setToast(`Added ${quantity} × ${product.name} to cart`)
    } catch (err) {
      setError(err.response?.data?.error || 'Could not add this to your cart.')
    } finally {
      setAdding(false)
    }
  }

  if (loading) return <Spinner />
  if (error && !product) {
    return (
      <div className="page">
        <div className="empty-state">
          <h3>Product not found</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }
  if (!product) return null

  const images = product.images || []
  const outOfStock = product.inventory_quantity <= 0

  return (
    <div className="page">
      <div className="product-detail">
        <div>
          <div className="gallery-main">
            <ProductThumb
              image={images[activeImage]?.image}
              alt={images[activeImage]?.alt_text}
              name={product.name}
              fontSize="3rem"
            />
          </div>
          {images.length > 1 && (
            <div className="gallery-thumbs">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  className={i === activeImage ? 'active' : ''}
                  onClick={() => setActiveImage(i)}
                >
                  <img src={img.image} alt={img.alt_text || ''} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="label">{product.category?.name}</p>
          <h1 style={{ marginTop: 4 }}>{product.name}</h1>
          <p className="tabular" style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 12 }}>
            ${Number(product.price).toFixed(2)}
          </p>

          <p className={`stock-line ${outOfStock ? 'low' : ''}`} style={{ marginTop: 8 }}>
            {outOfStock ? 'Out of stock' : `${product.inventory_quantity} in stock`}
          </p>

          <p style={{ marginTop: 20, color: 'var(--ink-muted)', lineHeight: 1.6 }}>{product.description}</p>

          {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 24 }}>
            {!outOfStock && (
              <div className="qty-stepper">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">−</button>
                <span className="tabular">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.inventory_quantity, q + 1))}
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            )}
            <button className="btn btn-primary" onClick={handleAddToCart} disabled={outOfStock || adding}>
              {outOfStock ? 'Out of stock' : adding ? 'Adding…' : 'Add to cart'}
            </button>
          </div>
        </div>
      </div>

      {recs.length > 0 && (
        <>
          <div className="divider" />
          <h2 style={{ marginBottom: 16 }}>You might also like</h2>
          <div className="recs-row">
            {recs.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </>
      )}

      <Toast message={toast} />
    </div>
  )
}
