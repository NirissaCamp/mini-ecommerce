import { useEffect, useMemo, useState } from 'react'
import {
    adminCreateProduct,
    adminDeleteProduct,
    adminListProducts,
    adminUpdateProduct,
    adminAddProductImage,
    adminDeleteProductImage,
} from '../../api/adminProducts'
import './AdminProductsPage.css'

const EMPTY_FORM = {
    name: '',
    description: '',
    price: '',
    stock: '',
    active: true,
}

function toPayload(form) {
    return {
        name: form.name.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        stock: Number(form.stock),
        active: Boolean(form.active),
    }
}

export default function AdminProductsPage() {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState(EMPTY_FORM)
    const [editingId, setEditingId] = useState(null)
    const [managingImagesFor, setManagingImagesFor] = useState(null)//product object
    const [imageUrl, setImageUrl] = useState('')
    const [imageIsPrimary, setImageIsPrimary] = useState(false)
    const [imageSaving, setImageSaving] = useState(false)

    const token = useMemo(() => localStorage.getItem('token'), [])

    async function loadProducts() {
        if (!token) {
            setError('Please sign in first. (No token found)')
            setItems([])
            return
        }
        setLoading(true)
        setError('')
        try {
            const data = await adminListProducts(token)
            setItems(Array.isArray(data) ? data : [])
        } catch (e) {
            setError(e.message || 'Failed to load products')
            setItems([])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadProducts()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    function onChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    function startEdit(item) {
        setEditingId(item.id)
        setForm({
            name: item.name ?? '',
            description: item.description ?? '',
            price: item.price ?? '',
            stock: item.stock ?? '',
            active: Boolean(item.active),
        })
    }

    function cancelEdit() {
        setEditingId(null)
        setForm(EMPTY_FORM)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        if (!token) {
            setError('Please sign in first.')
            return
        }

        const payload = toPayload(form)
        if (!payload.name || Number.isNaN(payload.price) || Number.isNaN(payload.stock)) {
            setError('Please fill valid name / price / stock.')
            return
        }

        setSaving(true)
        setError('')
        try {
            if (editingId == null) {
                await adminCreateProduct(token, payload)
            } else {
                await adminUpdateProduct(token, editingId, payload)
            }
            cancelEdit()
            await loadProducts()
        } catch (e2) {
            setError(e2.message || 'Save failed')
        } finally {
            setSaving(false)
        }
    }

    async function handleDelete(id) {
        if (!token) return
        const ok = window.confirm('Delete this product?')
        if (!ok) return

        setError('')
        try {
            await adminDeleteProduct(token, id)
            await loadProducts()
        } catch (e) {
            setError(e.message || 'Delete failed')
        }
    }

    async function handleAddImage(e) {
        e.preventDefault()
        if (!imageUrl.trim()) return
        setImageSaving(true)
        try {
            await adminAddProductImage(token, managingImagesFor.id, {
                imageUrl: imageUrl.trim(),
                isPrimary: imageIsPrimary,
                sortOrder: managingImagesFor.images?.length ?? 0,
            })
            setImageUrl('')
            setImageIsPrimary(false)
            await loadProducts()
            // refresh managingImagesFor with updated images
            setManagingImagesFor(prev => ({
                ...prev,
                images: items.find(p => p.id === prev.id)?.images ?? prev.images,
            }))
        } catch (e) {
            setError(e.message || 'Failed to add image')
        } finally {
            setImageSaving(false)
        }
    }

    async function handleDeleteImage(imageId) {
        if (!window.confirm('Delete this image?')) return
        try {
            await adminDeleteProductImage(token, managingImagesFor.id, imageId)
            await loadProducts()
            setManagingImagesFor(prev => ({
                ...prev,
                images: prev.images.filter(img => img.id !== imageId),
            }))
        } catch (e) {
            setError(e.message || 'Failed to delete image')
        }
    }

    return (
        <main className="admin-page">
            <div className="admin-page__inner">
                <h1>Admin - Products</h1>
                <p className="admin-page__hint">
                    Manage products (create / update / delete). Requires ADMIN role.
                </p>

                {error && <div className="admin-page__error">{error}</div>}

                <section className="admin-card">
                    <h2>{editingId == null ? 'Create Product' : `Edit Product #${editingId}`}</h2>
                    <form className="admin-form" onSubmit={handleSubmit}>
                        <label>
                            Name
                            <input
                                value={form.name}
                                onChange={(e) => onChange('name', e.target.value)}
                                required
                            />
                        </label>

                        <label>
                            Description
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={(e) => onChange('description', e.target.value)}
                            />
                        </label>

                        <label>
                            Price
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={form.price}
                                onChange={(e) => onChange('price', e.target.value)}
                                required
                            />
                        </label>

                        <label>
                            Stock
                            <input
                                type="number"
                                min="0"
                                value={form.stock}
                                onChange={(e) => onChange('stock', e.target.value)}
                                required
                            />
                        </label>

                        <label className="admin-form__checkbox">
                            <input
                                type="checkbox"
                                checked={form.active}
                                onChange={(e) => onChange('active', e.target.checked)}
                            />
                            Active
                        </label>

                        <div className="admin-form__actions">
                            <button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : editingId == null ? 'Create' : 'Update'}
                            </button>
                            {editingId != null && (
                                <button type="button" onClick={cancelEdit} className="secondary">
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="admin-card">
                    <h2>Products</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : items.length === 0 ? (
                        <p>No products</p>
                    ) : (
                        <table className="admin-table">
                            <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Active</th>
                                <th>Actions</th>
                            </tr>
                            </thead>
                            <tbody>
                            {items.map((p) => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.name}</td>
                                    <td>{p.price}</td>
                                    <td>{p.stock}</td>
                                    <td>{String(p.active)}</td>
                                    <td>
                                        <button onClick={() => startEdit(p)}>Edit</button>
                                        <button onClick={() => { setManagingImagesFor(p); setImageUrl(''); setImageIsPrimary(false); }}>
                                            Images ({p.images?.length ?? 0})
                                        </button>
                                        <button onClick={() => handleDelete(p.id)} className="danger">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </section>
                {managingImagesFor && (
                    <section className="admin-card">
                        <h2>Images — {managingImagesFor.name}</h2>
                        <button type="button" className="secondary" onClick={() => setManagingImagesFor(null)}>
                            Close
                        </button>

                        {/* existing images */}
                        {managingImagesFor.images?.length > 0 ? (
                            <table className="admin-table" style={{ marginTop: 12 }}>
                                <thead>
                                <tr>
                                    <th>Preview</th>
                                    <th>URL</th>
                                    <th>Primary</th>
                                    <th>Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {managingImagesFor.images.map(img => (
                                    <tr key={img.id}>
                                        <td><img src={img.imageUrl} alt="" style={{ width: 60, height: 45, objectFit: 'cover',
                                            borderRadius: 4 }} /></td>
                                        <td style={{ fontSize: 12, maxWidth: 300, wordBreak: 'break-all' }}>{img.imageUrl}</td>
                                        <td>{img.isPrimary ? 'Yes' : 'No'}</td>
                                        <td>
                                            <button className="danger" onClick={() => handleDeleteImage(img.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        ) : (
                            <p>No images yet.</p>
                        )}

                        {/* add new image */}
                        <form onSubmit={handleAddImage} className="admin-form" style={{ marginTop: 16 }}>
                            <h3>Add Image</h3>
                            <label>
                                Image URL
                                <input
                                    value={imageUrl}
                                    onChange={e => setImageUrl(e.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                    required
                                />
                            </label>
                            <label className="admin-form__checkbox">
                                <input
                                    type="checkbox"
                                    checked={imageIsPrimary}
                                    onChange={e => setImageIsPrimary(e.target.checked)}
                                />
                                Set as primary image
                            </label>
                            <div className="admin-form__actions">
                                <button type="submit" disabled={imageSaving}>
                                    {imageSaving ? 'Adding...' : 'Add Image'}
                                </button>
                            </div>
                        </form>
                    </section>
                )}
            </div>
        </main>
    )
}