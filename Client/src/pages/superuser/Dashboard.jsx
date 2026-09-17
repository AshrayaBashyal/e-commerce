import { useEffect, useState } from 'react'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { Crown, ShieldCheck, Users } from 'lucide-react'
import * as usersApi from '../../api/users'
import Spinner from '../../components/Spinner'

const MAX_PAGES = 8

const COLORS = {
  Superusers: '#1F5C4D',
  Admins: '#6B685F',
  Customers: '#E4E1DC',
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

export default function SuperuserDashboard() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [totalUsers, setTotalUsers] = useState(0)
  const [breakdown, setBreakdown] = useState({ Superusers: 0, Admins: 0, Customers: 0 })
  const [capped, setCapped] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    const run = async () => {
      let page = 1
      let all = []
      let count = 0
      let isCapped = false
      while (page <= MAX_PAGES) {
        const { data } = await usersApi.listUsers({ page })
        count = data.count
        all = all.concat(data.results)
        if (!data.next) break
        if (page === MAX_PAGES) isCapped = true
        page += 1
      }
      return { all, count, isCapped }
    }

    run()
      .then(({ all, count, isCapped }) => {
        if (cancelled) return
        setTotalUsers(count)
        setCapped(isCapped)
        const b = { Superusers: 0, Admins: 0, Customers: 0 }
        all.forEach((u) => {
          if (u.is_superuser) b.Superusers += 1
          else if (u.is_staff) b.Admins += 1
          else b.Customers += 1
        })
        setBreakdown(b)
      })
      .catch(() => {
        if (!cancelled) setError('Could not load user data.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <Spinner />

  const pieData = Object.entries(breakdown)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Dashboard</h1>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="stat-grid">
        <StatCard icon={Users} label="Total users" value={totalUsers} />
        <StatCard icon={ShieldCheck} label="Admins" value={breakdown.Admins} />
        <StatCard icon={Crown} label="Superusers" value={breakdown.Superusers} />
      </div>

      {pieData.length > 0 && (
        <div className="panel" style={{ padding: 20, marginTop: 24, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ width: 220, height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                  {pieData.map((entry) => (
                    <Cell key={entry.name} fill={COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h3 style={{ marginBottom: 4 }}>Role breakdown</h3>
            {pieData.map((d) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[d.name] }} />
                <span style={{ fontSize: '0.9375rem' }}>{d.name}</span>
                <span className="label tabular">{d.value}</span>
              </div>
            ))}
            {capped && (
              <p className="label" style={{ marginTop: 8, maxWidth: 220 }}>
                Based on the most recent {MAX_PAGES * 10} users, not the full list.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
