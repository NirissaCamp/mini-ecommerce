import { useEffect, useMemo, useState } from 'react'
import {
    adminCreateProduct,
    adminDeleteProduct,
    adminListProducts,
    adminUpdateProduct,
    adminAddProductImage,
    adminDeleteProductImage,
    adminAddProductBullet,
    adminAddShipping,
    adminDeleteShipping,
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
    const [bulletForm, setBulletForm] = useState({brand:'', weight:'',dimension:'',content:''})
    const [bulletSaving, setBulletSaving] = useState(false)
    const [shippingForm, setShippingForm] = useState({label:'', description:'', isFree:false})
    const [shippingSaving, setShippingSaving] = useState(false)

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

    useEffect(() => {
        if (managingImagesFor) {
            const updated = items.find(p => p.id === managingImagesFor.id)
            if (updated) setManagingImagesFor(updated)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items])

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

        setManagingImagesFor(item)
        setImageUrl('')
        setImageIsPrimary(false)
        const existingBullet = item.bullets?.[0]
        setBulletForm({
            brand: existingBullet?.brand ?? '',
            weight: existingBullet?.weight ?? '',
            dimension: existingBullet?.dimension ?? '',
            content: existingBullet?.content ?? '',
        })
        setShippingForm({label:'', description: '', isFree: false})
    }

    function cancelEdit() {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setBulletForm({ brand: '', weight: '', dimension: '', content: '' })
        setImageUrl('')
        setImageIsPrimary(false)
        setShippingForm({ label: '', description: '', isFree: false })
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

        if(editingId == null && !imageUrl.trim()){
            const wantsImage = window.confirm('Do you want to add image information?')
            if (wantsImage) return
        }

        if(editingId == null && !shippingForm.label.trim()){
            const wantsShipping = window.confirm('Do you want to add shipping option?')
            if (wantsShipping) return
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
        } catch (e) {
            setError(e.message || 'Failed to delete image')
        }
    }

    async function handleAddBullet(e) {
        e.preventDefault()
        if (!managingImagesFor) return
        setBulletSaving(true)
        try {
            await adminAddProductBullet(token, managingImagesFor.id, bulletForm)
            await loadProducts()
        } catch (e) {
            setError(e.message || 'Failed to add bullet')
        } finally {
            setBulletSaving(false)
        }
    }

    async function handleAddShipping(e) {
        e.preventDefault()
        if (!managingImagesFor) return
        setShippingSaving(true)
        try {
            await adminAddShipping(token, managingImagesFor.id, shippingForm)
            setShippingForm({ label: '', description: '', isFree: false })
            await loadProducts()
        } catch (e) {
            setError(e.message || 'Failed to add shipping')
        } finally {
            setShippingSaving(false)
        }
    }

    async function handleDeleteShipping(shippingId) {
        if (!window.confirm('Delete this shipping option?')) return
        try {
            await adminDeleteShipping(token, managingImagesFor.id, shippingId)
            await loadProducts()
        } catch (e) {
            setError(e.message || 'Failed to delete shipping')
        }
    }

    return (
        <div className="ap-page">
            <h1 className="ap-title">Products</h1>
            {error && <div className="ap-error">{error}</div>}

            <div className="ap-grid">

                {/* Left: Products + Bullet in one card */}
                <section className="ap-card">
                    <h2 className="ap-card__title">
                        {editingId == null ? 'Products' : `Edit Product #${editingId}`}
                    </h2>
                    <form className="ap-form" onSubmit={handleSubmit}>
                        <div className="ap-form__row">
                            <label className="ap-label">
                                Name
                                <input className="ap-input" value={form.name} onChange={e => onChange('name', e.target.value)} required />
                            </label>
                            <label className="ap-label">
                                Price
                                <input className="ap-input" type="number" step="0.01" min="0.01" value={form.price} onChange={e => onChange('price', e.target.value)} required />
                            </label>
                        </div>
                        <div className="ap-form__row">
                            <label className="ap-label">
                                Stock
                                <input className="ap-input" type="number" min="0" value={form.stock} onChange={e => onChange('stock', e.target.value)} required />
                            </label>
                            <label className="ap-label">
                                Active
                                <select className="ap-input" value={String(form.active)} onChange={e => onChange('active', e.target.value === 'true')}>
                                    <option value="true">True</option>
                                    <option value="false">False</option>
                                </select>
                            </label>
                        </div>
                        <label className="ap-label">
                            Description
                            <textarea className="ap-input" rows={4} value={form.description} onChange={e => onChange('description', e.target.value)} placeholder="Short Description" />
                        </label>

                        {/* Bullet sub-section */}
                        <div className="ap-subsection">
                            <h3 className="ap-subsection__title">Bullet</h3>
                        </div>
                        <div className="ap-form__row">
                            <label className="ap-label">
                                Brand
                                <input className="ap-input" value={bulletForm.brand} onChange={e => setBulletForm(p => ({ ...p, brand: e.target.value }))} />
                            </label>
                            <label className="ap-label">
                                Weight
                                <input className="ap-input" value={bulletForm.weight} onChange={e => setBulletForm(p => ({ ...p, weight: e.target.value }))} />
                            </label>
                        </div>
                        <label className="ap-label">
                            Dimension
                            <input className="ap-input" value={bulletForm.dimension} onChange={e => setBulletForm(p => ({ ...p, dimension: e.target.value }))} />
                        </label>
                        <label className="ap-label">
                            Content
                            <textarea className="ap-input" rows={3} value={bulletForm.content} onChange={e => setBulletForm(p => ({ ...p, content: e.target.value }))} placeholder="Bullet point description" />
                        </label>

                        <div className="ap-form__actions">
                            <button type="submit" className="ap-btn ap-btn--green" disabled={saving}>
                                {saving ? 'Saving...' : editingId == null ? 'Add' : 'Update'}
                            </button>
                            {editingId != null && (
                                <button type="button" className="ap-btn ap-btn--grey" onClick={cancelEdit}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                {/* Right: Images + Shipping stacked */}
                <div className="ap-right-col">

                    {/* Images */}
                    <section className="ap-card">
                        <h2 className="ap-card__title">Images</h2>
                        {managingImagesFor?.images?.length > 0 && (
                            <table className="ap-table" style={{ marginBottom: 16 }}>
                                <thead>
                                <tr>
                                    <th>Preview</th>
                                    <th>URL</th>
                                    <th>Primary</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {managingImagesFor.images.map(img => (
                                    <tr key={img.id}>
                                        <td><img src={img.imageUrl} alt="" style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 4 }} /></td>
                                        <td className="ap-table__url">{img.imageUrl}</td>
                                        <td>{img.isPrimary ? 'Yes' : 'No'}</td>
                                        <td>
                                            <button className="ap-btn ap-btn--red-sm" onClick={() => handleDeleteImage(img.id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        <form className="ap-form" onSubmit={handleAddImage}>
                            <label className="ap-label">
                                Image URL
                                <input className="ap-input" value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://images.unsplash.com/..." required />
                            </label>
                            <label className="ap-checkbox">
                                <input type="checkbox" checked={imageIsPrimary} onChange={e => setImageIsPrimary(e.target.checked)} />
                                Set as primary image
                            </label>
                            <div className="ap-form__actions">
                                <button type="submit" className="ap-btn ap-btn--green" disabled={imageSaving || !managingImagesFor}>
                                    {imageSaving ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </section>

                    {/* Shipping */}
                    <section className="ap-card">
                        <h2 className="ap-card__title">Shipping Option</h2>
                        {managingImagesFor?.shippingOptions?.length > 0 && (
                            <table className="ap-table" style={{ marginBottom: 16 }}>
                                <thead>
                                <tr><th>Label</th><th>Description</th><th>Free</th><th>Action</th></tr>
                                </thead>
                                <tbody>
                                {managingImagesFor.shippingOptions.map(s => (
                                    <tr key={s.id}>
                                        <td>{s.label}</td>
                                        <td>{s.description}</td>
                                        <td>{s.isFree ? 'Yes' : 'No'}</td>
                                        <td><button className="ap-btn ap-btn--red-sm" onClick={() => handleDeleteShipping(s.id)}>Delete</button></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        <form className="ap-form" onSubmit={handleAddShipping}>
                            <label className="ap-label">
                                Support Shipping
                                <input className="ap-input" value={shippingForm.label} onChange={e => setShippingForm(p => ({ ...p, label: e.target.value }))} required />
                            </label>
                            <label className="ap-label">
                                Shipping Description
                                <input className="ap-input" value={shippingForm.description} onChange={e => setShippingForm(p => ({ ...p, description: e.target.value }))} />
                            </label>
                            <label className="ap-checkbox">
                                <input type="checkbox" checked={shippingForm.isFree} onChange={e => setShippingForm(p => ({ ...p, isFree: e.target.checked }))} />
                                Free shipping
                            </label>
                            <div className="ap-form__actions">
                                <button type="submit" className="ap-btn ap-btn--green" disabled={shippingSaving || !managingImagesFor}>
                                    {shippingSaving ? 'Adding...' : 'Add'}
                                </button>
                            </div>
                        </form>
                    </section>

                </div>
            </div>

            {/* Products table */}
            <section className="ap-card" style={{ marginTop: 16 }}>
                <h2 className="ap-card__title">Products</h2>
                {loading ? (
                    <p>Loading...</p>
                ) : items.length === 0 ? (
                    <p>No products</p>
                ) : (
                    <table className="ap-table ap-table--full">
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
                        {items.map(p => (
                            <tr key={p.id}>
                                <td>{p.id}</td>
                                <td>{p.name}</td>
                                <td>{p.price}</td>
                                <td>{p.stock}</td>
                                <td>{String(p.active)}</td>
                                <td className="ap-table__actions">
                                    <button className="ap-btn ap-btn--sm" onClick={() => startEdit(p)}>Edit</button>
                                    <button className="ap-btn ap-btn--red-sm" onClick={() => handleDelete(p.id)}>Delete</button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                )}
            </section>
        </div>
    )
}