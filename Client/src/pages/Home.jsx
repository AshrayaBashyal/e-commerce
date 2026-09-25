import { useEffect, useState } from 'react'
import { Search, ShieldCheck, Truck, Undo2 } from 'lucide-react'
import * as productsApi from '../api/products'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { stockPhoto } from '../utils/placeholder'

export default function Home() {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({ search: '', category: '', min_price: '', max_price: '', in_stock: '' })
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    productsApi.listCategories().then(({ data }) => setCategories(data.results || data)).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    const params = { page }
    if (filters.search) params.search = filters.search
    if (filters.category) params.category = filters.category
    if (filters.min_price) params.min_price = filters.min_price
    if (filters.max_price) params.max_price = filters.max_price
    if (filters.in_stock) params.in_stock = filters.in_stock

    productsApi
      .listProducts(params)
      .then(({ data }) => {
        if (!cancelled) setResult(data)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load products. Is the backend running?')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [filters, page])

  const updateFilter = (key, value) => {
    setPage(1)
    setFilters((f) => ({ ...f, [key]: value }))
  }

  const goToCategory = (id) => {
    updateFilter('category', id)
    document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeCategory = categories.find((c) => String(c.id) === String(filters.category))

  return (
    <>
      <section className="hero-banner" style={{ backgroundImage: `url(${stockPhoto('xcart-storefront', 1600, 640)})` }}>
        <div className="hero-scrim" />
        <div className="hero-content">
          <p className="label" style={{ color: 'rgba(255,255,255,0.75)' }}>X-Cart</p>
          <h1 style={{ color: '#fff', marginTop: 8 }}>Everything you need, in one place</h1>
          <p style={{ color: 'rgba(255,255,255,0.85)', marginTop: 10, maxWidth: 460 }}>
            {result ? `${result.count} products across ${categories.length} categories` : 'Browse the catalog'} — with
            a checkout that just works.
          </p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 24 }}
            onClick={() => document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          >
            Shop now
          </button>
        </div>
      </section>

      <div className="page">
        <div className="value-props">
          <div className="value-prop">
            <Truck size={20} />
            <div>
              <p style={{ fontWeight: 600 }}>Fast checkout</p>
              <p className="label">Stripe-hosted payment, done in a couple taps</p>
            </div>
          </div>
          <div className="value-prop">
            <ShieldCheck size={20} />
            <div>
              <p style={{ fontWeight: 600 }}>Secure by default</p>
              <p className="label">We never see or store your card details</p>
            </div>
          </div>
          <div className="value-prop">
            <Undo2 size={20} />
            <div>
              <p style={{ fontWeight: 600 }}>Easy cancellations</p>
              <p className="label">Cancel anytime before an order ships</p>
            </div>
          </div>
        </div>

        {categories.length > 0 && (
          <>
            <div className="page-header">
              <h2>Shop by category</h2>
            </div>
            <div className="category-showcase">
              {categories.slice(0, 8).map((c) => (
                <button key={c.id} className="category-tile" onClick={() => goToCategory(c.id)}>
                  <img src={stockPhoto(c.name, 400, 300)} alt="" />
                  <span className="category-tile-label">{c.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="divider" />

        <div className="page-header" id="catalog">
          <div>
            <h2>{activeCategory ? activeCategory.name : 'All products'}</h2>
            <p className="label">{result ? `${result.count} products` : ' '}</p>
          </div>
        </div>

        <div className="filter-bar">
          <div className="search-input-wrap">
            <Search size={16} />
            <input
              className="input"
              placeholder="Search products…"
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
            />
          </div>
          <select className="input" value={filters.category} onChange={(e) => updateFilter('category', e.target.value)}>
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <input
            className="input"
            type="number"
            placeholder="Min price"
            style={{ maxWidth: 120 }}
            value={filters.min_price}
            onChange={(e) => updateFilter('min_price', e.target.value)}
          />
          <input
            className="input"
            type="number"
            placeholder="Max price"
            style={{ maxWidth: 120 }}
            value={filters.max_price}
            onChange={(e) => updateFilter('max_price', e.target.value)}
          />
          <select className="input" style={{ maxWidth: 160 }} value={filters.in_stock} onChange={(e) => updateFilter('in_stock', e.target.value)}>
            <option value="">In stock &amp; out</option>
            <option value="true">In stock only</option>
            <option value="false">Out of stock only</option>
          </select>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 20 }}>{error}</div>}

        {loading ? (
          <Spinner />
        ) : result && result.results.length > 0 ? (
          <>
            <div className="product-grid">
              {result.results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
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
        ) : (
          <div className="empty-state">
            <h3>No products match your filters</h3>
            <p>Try widening your search or clearing a filter.</p>
          </div>
        )}
      </div>
    </>
  )
}
