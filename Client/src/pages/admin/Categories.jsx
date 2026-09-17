import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import * as productsApi from '../../api/products'
import Spinner from '../../components/Spinner'

const EMPTY = { name: '', description: '', is_active: true }

export default function AdminCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {...} = edit
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    productsApi
      .listCategories()
      .then(({ data }) => setCategories(data.results || data))
      .catch(() => setError('Could not load categories.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const openNew = () => {
    setForm(EMPTY)
    setEditing({})
  }

  const openEdit = (cat) => {
    setForm({ name: cat.name, description: cat.description || '', is_active: cat.is_active })
    setEditing(cat)
  }

  const close = () => setEditing(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      if (editing.id) {
        await productsApi.updateCategory(editing.id, form)
      } else {
        await productsApi.createCategory(form)
      }
      close()
      load()
    } catch (err) {
      const data = err.response?.data
      const firstError = data && typeof data === 'object' ? Object.values(data)[0] : null
      setError((Array.isArray(firstError) ? firstError[0] : firstError) || 'Could not save this category.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="page">
      <div className="toolbar">
        <h1>Categories</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> New category
        </button>
      </div>

      {error && !editing && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      <div className="panel">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 500 }}>{c.name}</td>
                <td style={{ color: 'var(--ink-muted)' }}>{c.description}</td>
                <td>
                  <span className={`pill ${c.is_active ? 'pill-accent' : 'pill-muted'}`}>
                    {c.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing.id ? 'Edit category' : 'New category'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={close}><X size={16} /></button>
            </div>

            {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9375rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (visible to customers)
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
