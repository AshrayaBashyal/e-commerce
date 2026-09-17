import { useEffect, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertCircle, DollarSign, Package, ShoppingBag, Tag } from 'lucide-react'
import * as productsApi from '../../api/products'
import * as ordersApi from '../../api/orders'
import Spinner from '../../components/Spinner'

const STATUS_COLORS = {
  PENDING: '#6B685F',
  PROCESSING: '#6B685F',
  SHIPPED: '#1F5C4D',
  DELIVERED: '#1F5C4D',
  CANCELLED: '#B3432B',
}

const MAX_PAGES = 8 // cap how many order pages we walk to build the charts

async function fetchOrdersSample() {
  let page = 1
  let all = []
  let count = 0
  let capped = false
  while (page <= MAX_PAGES) {
    const { data } = await ordersApi.listOrders({ page })
    count = data.count
    all = all.concat(data.results)
    if (!data.next) break
    if (page === MAX_PAGES) capped = true
    page += 1
  }
  return { orders: all, count, capped }
}

function StatCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="panel stat-card">
      <div className="stat-card-icon"><Icon size={18} /></div>
      <div>
        <p className="label">{label}</p>
        <p className="stat-value tabular">{value}</p>
        {sub && <p className="label" style={{ marginTop: 2 }}>{sub}</p>}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [productCount, setProductCount] = useState(0)
  const [categoryCount, setCategoryCount] = useState(0)
  const [orderCount, setOrderCount] = useState(0)
  const [statusData, setStatusData] = useState([])
  const [revenue, setRevenue] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [sampleCapped, setSampleCapped] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    Promise.all([
      productsApi.listProducts({ page: 1 }),
      productsApi.listCategories(),
      fetchOrdersSample(),
    ])
      .then(([productsRes, categoriesRes, ordersSample]) => {
        if (cancelled) return
        setProductCount(productsRes.data.count)
        const cats = categoriesRes.data.results || categoriesRes.data
        setCategoryCount(cats.length)
        setOrderCount(ordersSample.count)
        setSampleCapped(ordersSample.capped)

        const counts = {}
        let paidTotal = 0
        let pending = 0
        ordersSample.orders.forEach((o) => {
          counts[o.status] = (counts[o.status] || 0) + 1
          if (o.payment_status === 'PAID') paidTotal += Number(o.total_amount)
          if (o.status === 'PENDING' || o.status === 'PROCESSING') pending += 1
        })
        setStatusData(
          ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED']
            .map((s) => ({ status: s, count: counts[s] || 0 }))
            .filter((s) => s.count > 0),
        )
        setRevenue(paidTotal)
        setPendingCount(pending)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load dashboard data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="stat-grid">
        <StatCard icon={Package} label="Products" value={productCount} />
        <StatCard icon={Tag} label="Categories" value={categoryCount} />
        <StatCard icon={ShoppingBag} label="Orders" value={orderCount} />
        <StatCard icon={AlertCircle} label="Needs attention" value={pendingCount} sub="Pending + processing" />
        <StatCard
          icon={DollarSign}
          label="Revenue (paid)"
          value={`$${revenue.toFixed(2)}`}
          sub={sampleCapped ? `From most recent ${MAX_PAGES * 10} orders` : undefined}
        />
      </div>

      {statusData.length > 0 && (
        <div className="panel" style={{ padding: 20, marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>Orders by status</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={statusData}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="status" tick={{ fill: 'var(--ink-muted)', fontSize: 12 }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: 'var(--ink-muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--bg)' }}
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || 'var(--ink-muted)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {sampleCapped && (
            <p className="label" style={{ marginTop: 8 }}>
              Based on the most recent {MAX_PAGES * 10} orders, not the full history.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
