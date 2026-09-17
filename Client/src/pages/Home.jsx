import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import * as productsApi from '../api/products'
import ProductCard from '../components/ProductCard'
import Pagination from '../components/Pagination'
import Spinner from '../components/Spinner'
import { getInitials, getTile } from '../utils/placeholder'

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

  const activeCategory = categories.find((c) => String(c.id) === String(filters.category))

  return (
    <div className="page">
      <section className="hero">
        <p className="label" style={{ color: 'var(--accent)' }}>X-Cart</p>
        <h1 style={{ marginTop: 6 }}>
          {activeCategory ? activeCategory.name : 'Everything you need, in one place'}
        </h1>
        <p style={{ color: 'var(--ink-muted)', marginTop: 8, maxWidth: 520 }}>
          {activeCategory?.description ||
            `Browse ${result ? result.count : ''} products across ${categories.length} categories.`}
        </p>
      </section>

      {categories.length > 0 && (
        <div className="category-strip">
          <button
            className={`category-chip${!filters.category ? ' active' : ''}`}
            onClick={() => updateFilter('category', '')}
          >
            <span className="category-chip-icon" style={{ background: 'var(--accent-tint)', color: 'var(--accent)' }}>
              All
            </span>
            All items
          </button>
          {categories.map((c) => {
            const tile = getTile(c.name)
            const active = String(filters.category) === String(c.id)
            return (
              <button
                key={c.id}
                className={`category-chip${active ? ' active' : ''}`}
                onClick={() => updateFilter('category', active ? '' : c.id)}
              >
                <span className="category-chip-icon" style={{ background: tile.bg, color: tile.fg }}>
                  {getInitials(c.name)}
                </span>
                {c.name}
              </button>
            )
          })}
        </div>
      )}

      <div className="page-header">
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
  )
}
