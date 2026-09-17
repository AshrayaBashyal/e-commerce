import { useEffect, useState } from 'react'
import { ImageOff, Plus, Trash2, X } from 'lucide-react'
import * as productsApi from '../../api/products'
import Spinner from '../../components/Spinner'
import Pagination from '../../components/Pagination'

const EMPTY = { name: '', description: '', price: '', inventory_quantity: '', category: '', is_active: true }

export default function AdminProducts() {
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [imageFile, setImageFile] = useState(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const load = () => {
    setLoading(true)
    productsApi
      .listProducts({ page })
      .then(({ data }) => setResult(data))
      .catch(() => setError('Could not load products.'))
      .finally(() => setLoading(false))
  }

  useEffect(load, [page])

  useEffect(() => {
    productsApi.listCategories().then(({ data }) => setCategories(data.results || data)).catch(() => {})
  }, [])

  const openNew = () => {
    setForm(EMPTY)
    setFormError('')
    setEditing({})
  }

  const openEdit = (p) => {
    setForm({
      name: p.name,
      description: p.description || '',
      price: p.price,
      inventory_quantity: p.inventory_quantity,
      category: p.category?.id || '',
      is_active: p.is_active,
      images: p.images || [],
      id: p.id,
    })
    setFormError('')
    setEditing(p)
  }

  const close = () => {
    setEditing(null)
    setImageFile(null)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError('')
    const payload = {
      name: form.name,
      description: form.description,
      price: form.price,
      inventory_quantity: form.inventory_quantity,
      category: form.category,
      is_active: form.is_active,
    }
    try {
      if (editing.id) {
        await productsApi.updateProduct(editing.id, payload)
      } else {
        await productsApi.createProduct(payload)
      }
      close()
      load()
    } catch (err) {
      const data = err.response?.data
      const firstError = data && typeof data === 'object' ? Object.values(data)[0] : null
      setFormError((Array.isArray(firstError) ? firstError[0] : firstError) || 'Could not save this product.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivateOrDelete = async (p) => {
    if (!confirm(`Deactivate "${p.name}"? It will stop showing to customers. (Products with order history can't be fully deleted.)`)) return
    try {
      await productsApi.deleteProduct(p.id)
    } catch (err) {
      if (err.response?.status === 409) {
        await productsApi.updateProduct(p.id, { is_active: false })
      } else {
        setError('Could not remove this product.')
        return
      }
    }
    load()
  }

  const handleImageUpload = async () => {
    if (!imageFile || !editing?.id) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('image', imageFile)
      fd.append('alt_text', form.name)
      fd.append('display_order', (form.images?.length || 0) + 1)
      const { data } = await productsApi.uploadProductImage(editing.id, fd)
      setForm((f) => ({ ...f, images: [...(f.images || []), data] }))
      setImageFile(null)
    } catch {
      setFormError('Could not upload that image.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleImageDelete = async (imageId) => {
    try {
      await productsApi.deleteProductImage(editing.id, imageId)
      setForm((f) => ({ ...f, images: f.images.filter((i) => i.id !== imageId) }))
    } catch {
      setFormError('Could not remove that image.')
    }
  }

  if (loading && !result) return <Spinner />

  return (
    <div className="page">
      <div className="toolbar">
        <h1>Products</h1>
        <button className="btn btn-primary" onClick={openNew}>
          <Plus size={16} /> New product
        </button>
      </div>

      {error && <div className="error-banner" style={{ marginBottom: 16 }}>{error}</div>}

      {result && (
        <>
          <div className="panel">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500 }}>{p.name}</td>
                    <td style={{ color: 'var(--ink-muted)' }}>{p.category?.name}</td>
                    <td className="tabular">${Number(p.price).toFixed(2)}</td>
                    <td className="tabular">{p.inventory_quantity}</td>
                    <td>
                      <span className={`pill ${p.is_active ? 'pill-accent' : 'pill-muted'}`}>
                        {p.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" onClick={() => handleDeactivateOrDelete(p)}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      )}

      {editing && (
        <div className="modal-backdrop" onClick={close}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h3>{editing.id ? 'Edit product' : 'New product'}</h3>
              <button className="btn btn-ghost btn-sm" onClick={close}><X size={16} /></button>
            </div>

            {formError && <div className="error-banner" style={{ marginBottom: 16 }}>{formError}</div>}

            <form className="form" onSubmit={handleSubmit}>
              <div className="field">
                <label>Name</label>
                <input className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Description</label>
                <textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="form-row">
                <div className="field">
                  <label>Price</label>
                  <input className="input" type="number" step="0.01" min="0" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
                </div>
                <div className="field">
                  <label>Inventory quantity</label>
                  <input className="input" type="number" min="0" required value={form.inventory_quantity} onChange={(e) => setForm({ ...form, inventory_quantity: e.target.value })} />
                </div>
              </div>
              <div className="field">
                <label>Category</label>
                <select className="input" required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9375rem' }}>
                <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
                Active (visible to customers)
              </label>

              {editing.id && (
                <div className="field">
                  <label>Images</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                    {(form.images || []).map((img) => (
                      <div key={img.id} style={{ position: 'relative', width: 64, height: 64 }}>
                        <img src={img.image} alt={img.alt_text} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-panel)', border: '1px solid var(--border)' }} />
                        <button
                          type="button"
                          onClick={() => handleImageDelete(img.id)}
                          style={{ position: 'absolute', top: -6, right: -6, background: 'var(--danger)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          aria-label="Remove image"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {(!form.images || form.images.length === 0) && (
                      <div style={{ width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed var(--border)', borderRadius: 'var(--radius-panel)' }}>
                        <ImageOff size={20} color="var(--ink-muted)" />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files[0])} />
                    <button type="button" className="btn btn-secondary btn-sm" disabled={!imageFile || uploadingImage} onClick={handleImageUpload}>
                      {uploadingImage ? 'Uploading…' : 'Upload'}
                    </button>
                  </div>
                </div>
              )}

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
