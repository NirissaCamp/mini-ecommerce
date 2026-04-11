import { useEffect, useMemo, useRef, useState } from 'react'
import {
    adminCreateProduct,
    adminDeleteProduct,
    adminListProducts,
    adminUpdateProduct,
    adminAddProductImage,
    adminUpdateProductImage,
    adminDeleteProductImage,
    adminAddProductBullet,
    adminAddShipping,
    adminUpdateShipping,
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
    const [searchTerm, setSearchTerm] = useState('')
    const [loading, setLoading] = useState(false)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')
    const [form, setForm] = useState(EMPTY_FORM)
    const [editingId, setEditingId] = useState(null)
    const [managingImagesFor, setManagingImagesFor] = useState(null)//product object
    const [imageUrl, setImageUrl] = useState('')
    const [imageIsPrimary, setImageIsPrimary] = useState(false)
    const [editingImageId,setEditingImageId] = useState(null)
    const [imageSaving, setImageSaving] = useState(false)
    const [bulletForm, setBulletForm] = useState({brand:'', weight:'',dimension:'',content:''})
    const [bulletSaving, setBulletSaving] = useState(false)
    const [shippingForm, setShippingForm] = useState({label:'', description:'', isFree:false})
    const [editingShippingId, setEditingShippingId] = useState(null)
    const [shippingSaving, setShippingSaving] = useState(false)
    const [formErrors, setFormErrors] = useState({})
    const [bulletErrors, setBulletErrors] = useState({})
    const [imageErrors, setImageErrors] = useState({})
    const [shippingErrors, setShippingErrors] = useState({})
    const [leftWidth, setLeftWidth] = useState(45)
    const [isDragging, setIsDragging] = useState(false)
    const [topHeight, setTopHeight] = useState(50)
    const [isHDragging, setIsHDragging] = useState(false)
    const gridRef = useRef(null)
    const rightColRef = useRef(null)
    const dragState = useRef(null)

    const filteredItems = items.filter(p=>
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.id).includes(searchTerm)
    )
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
        setBulletErrors({})
        setImageErrors({})
        setShippingErrors({})
    }

    function cancelEdit() {
        setEditingId(null)
        setForm(EMPTY_FORM)
        setManagingImagesFor(null)
        setEditingImageId(null)
        setEditingShippingId(null)
        setBulletForm({ brand: '', weight: '', dimension: '', content: '' })
        setImageUrl('')
        setImageIsPrimary(false)
        setShippingForm({ label: '', description: '', isFree: false })
        setFormErrors({})
        setBulletErrors({})
        setImageErrors({})
        setShippingErrors({})
    }

    function  startEditImage(img){
        setEditingImageId(img.id)
        setImageUrl(img.imageUrl)
        setImageIsPrimary(img.isPrimary)
        setImageErrors({})
    }

    function  cancelEditImage(){
        setEditingImageId(null)
        setImageUrl('')
        setImageIsPrimary(false)
        setImageErrors({})
    }

    function startEditShipping(s) {
        setEditingShippingId(s.id)
        setShippingForm({ label: s.label, description: s.description ?? '', isFree: s.isFree })
        setShippingErrors({})
    }

    function cancelEditShipping() {
        setEditingShippingId(null)
        setShippingForm({ label: '', description: '', isFree: false })
        setShippingErrors({})
    }

    function  validate(){
        const  errors = {}
        if (!form.name.trim()) errors.name = 'Name is required'
        else if (form.name.trim().length > 200) errors.name = 'Max 200 characters'

        if (!form.price) errors.price = 'Price is required'
        else if (Number(form.price)<0) errors.price = 'Must be greater than 0'

        if (form.stock === '')                          errors.stock = 'Stock is required'
        else if (Number(form.stock) < 0)               errors.stock = 'Cannot be negative'
        else if (!Number.isInteger(Number(form.stock))) errors.stock = 'Must be a whole number'

        if (form.description.length > 500)             errors.description = 'Max 500 characters'
        return errors
    }

    function validateBullet() {
        const errors = {}
        if (bulletForm.brand.length > 100)     errors.brand = 'Max 100 characters'
        if (bulletForm.weight.length > 100)    errors.weight = 'Max 100 characters'
        if (bulletForm.dimension.length > 100) errors.dimension = 'Max 100 characters'
        if (bulletForm.content.length > 500)   errors.content = 'Max 500 characters'
        return errors
    }

    function validateImage() {
        const errors = {}
        if (!imageUrl.trim())
            errors.imageUrl = 'Image URL is required'
        else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://'))
            errors.imageUrl = 'Must be a valid URL (http:// or https://)'
        return errors
    }

    function validateShipping() {
        const errors = {}
        if (!shippingForm.label.trim())             errors.label = 'Support Shipping is required'
        else if (shippingForm.label.length > 100)   errors.label = 'Max 100 characters'
        if (shippingForm.description.length > 200)  errors.description = 'Max 200 characters'
        return errors
    }

    async function handleSubmitAll(e) {
        e.preventDefault()
        if (!token) {
            setError('Please sign in first.')
            return
        }
        // Validate product form
        const errors = validate()
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)
            return
        }
        setFormErrors({})

        // Validate bullet if any field filled
        if (bulletForm.brand || bulletForm.weight || bulletForm.dimension || bulletForm.content) {
            const bErrors = validateBullet()
            if (Object.keys(bErrors).length > 0) { setBulletErrors(bErrors); return }
        }
        setBulletErrors({})

        // Validate image if URL filled
        if (imageUrl.trim()) {
            const iErrors = validateImage()
            if (Object.keys(iErrors).length > 0) { setImageErrors(iErrors); return }
        }
        setImageErrors({})

        // Validate shipping if label filled
        if (shippingForm.label.trim()) {
            const sErrors = validateShipping()
            if (Object.keys(sErrors).length > 0) { setShippingErrors(sErrors); return }
        }
        setShippingErrors({})

        setSaving(true)
        setError('')
        try {
            let productId

            // Save product
            if (editingId == null) {
                const newProduct = await adminCreateProduct(token, toPayload(form))
                productId = newProduct.id
            } else {
                await adminUpdateProduct(token, editingId, toPayload(form))
                productId = editingId
            }

            // Save bullet if any field filled
            if (bulletForm.brand || bulletForm.weight || bulletForm.dimension || bulletForm.content) {
                await adminAddProductBullet(token, productId, bulletForm)
            }

            // Save image if URL filled
            if (imageUrl.trim()) {
                await adminAddProductImage(token, productId, {
                    imageUrl: imageUrl.trim(),
                    isPrimary: imageIsPrimary,
                    sortOrder: managingImagesFor?.images?.length ?? 0,
                })
            }

            // Save shipping if label filled
            if (shippingForm.label.trim()) {
                await adminAddShipping(token, productId, shippingForm)
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
        const errors = validateImage()
        if (Object.keys(errors).length > 0) { setImageErrors(errors); return }
        setImageErrors({})

        //Warn if setting primary when another primary already exists
        if (imageIsPrimary){
            const existingPrimary = managingImagesFor?.images?.find(
                img => img.isPrimary && img.id !== editingImageId
            )
            if(existingPrimary){
                const ok = window.confirm('There is already a primary image. Set this one as primary instead?')
                if (!ok) return
            }
        }

        setImageSaving(true)
        try {
            //If setting as primary, demote the existing primary first
            if(imageIsPrimary){
                const  existingPrimary = managingImagesFor?.images?.find(
                    img => img.isPrimary && img.id !== editingImageId
                )
                if(existingPrimary){
                    await  adminUpdateProductImage(token,managingImagesFor.id, existingPrimary.id,{
                        imageUrl:existingPrimary.imageUrl,
                        isPrimary: false,
                    })
                }
            }

            if (editingImageId){
                await  adminUpdateProductImage(token, managingImagesFor.id, editingImageId, {
                    imageUrl:imageUrl.trim(),
                    isPrimary: imageIsPrimary,
                })
                setEditingImageId(null)
            }else {
                await adminAddProductImage(token, managingImagesFor.id, {
                    imageUrl: imageUrl.trim(),
                    isPrimary: imageIsPrimary,
                    sortOrder: managingImagesFor.images?.length ?? 0,
                })
            }
            setImageUrl('')
            setImageIsPrimary(false)
            await loadProducts()
        } catch (e) {
            setError(e.message || 'Failed to add image')
            setError(e.message || 'Failed to save image')
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
        const errors = validateBullet()
        if (Object.keys(errors).length > 0) { setBulletErrors(errors); return }
        setBulletErrors({})
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
        const errors = validateShipping()
        if (Object.keys(errors).length > 0) { setShippingErrors(errors); return }
        setShippingErrors({})
        setShippingSaving(true)
        try {
            if (editingShippingId) {
                await adminUpdateShipping(token, managingImagesFor.id, editingShippingId, shippingForm)
                setEditingShippingId(null)
            } else {
                await adminAddShipping(token, managingImagesFor.id, shippingForm)
            }
            setShippingForm({ label: '', description: '', isFree: false })
            await loadProducts()
        } catch (e) {
            setError(e.message || 'Failed to save shipping')
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

    function handleDividerMouseDown(e) {
        e.preventDefault()
        dragState.current = {
            startX: e.clientX,
            startWidth: leftWidth,
            gridWidth: gridRef.current.offsetWidth,
        }
        setIsDragging(true)

        function onMouseMove(e) {
            const { startX, startWidth, gridWidth } = dragState.current
            const dx = e.clientX - startX
            const newWidth = Math.min(75, Math.max(25, startWidth + (dx / gridWidth) * 100))
            setLeftWidth(newWidth)
        }

        function onMouseUp() {
            setIsDragging(false)
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }

    function handleHDividerMouseDown(e) {
        e.preventDefault()
        dragState.current = {
            startY: e.clientY,
            startHeight: topHeight,
            colHeight: rightColRef.current.offsetHeight,
        }
        setIsHDragging(true)

        function onMouseMove(e) {
            const { startY, startHeight, colHeight } = dragState.current
            const dy = e.clientY - startY
            const newHeight = Math.min(80, Math.max(20, startHeight + (dy / colHeight) * 100))
            setTopHeight(newHeight)
        }

        function onMouseUp() {
            setIsHDragging(false)
            document.removeEventListener('mousemove', onMouseMove)
            document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
    }

    return (
        <div className="ap-page">
            <h1 className="ap-title">Products</h1>
            {error && <div className="ap-error">{error}</div>}

            <div className="ap-editor-window">
            <div className="ap-search-bar">
                <span className="ap-search-bar__icon">🔍</span>
                <input
                    className="ap-search-bar__input"
                    placeholder="Search by name or ID"
                    value={searchTerm}
                    onChange={e=>setSearchTerm(e.target.value)}
                />
            </div>
            <div className="ap-grid" ref={gridRef}>

                {/* Left: Products + Bullet in one card */}
                <section className="ap-card" style={{ flex: `0 0 ${leftWidth}%` }}>
                    <h2 className="ap-card__title">Product Details</h2>
                    <form className="ap-form" >
                        <div className="ap-form__row">
                            <label className="ap-label">
                                Name
                                <input className="ap-input"
                                       value={form.name}
                                       onChange={e => {onChange('name', e.target.value)
                                           if (formErrors.name) setFormErrors(p => ({ ...p, name: '' }))
                                       }} required />
                                {formErrors.name && <span className="ap-field-error">{formErrors.name}</span> }
                            </label>
                            <label className="ap-label">
                                Price
                                <input className="ap-input" type="number" step="0.01" min="0.01"
                                       value={form.price}
                                       onChange={e => {onChange('price', e.target.value)
                                           if (formErrors.price) setFormErrors(p => ({ ...p, price: '' }))
                                       }} required />
                                {formErrors.price && <span className="ap-field-error">{formErrors.price}</span> }
                            </label>
                        </div>
                        <div className="ap-form__row">
                            <label className="ap-label">
                                Stock
                                <input className="ap-input"
                                       type="number" min="0" value={form.stock}
                                       onChange={e => {onChange('stock', e.target.value)
                                           if (formErrors.stock) setFormErrors(p => ({ ...p, stock: '' }))
                                       }} required />
                                {formErrors.stock && <span className="ap-field-error">{formErrors.stock}</span> }
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
                            <textarea className="ap-input" rows={3}
                                      value={form.description}
                                      onChange={e => {onChange('description', e.target.value)
                                          if (formErrors.description) setFormErrors(p => ({ ...p, description: '' }))
                                      }}
                                      placeholder="Short Description" />
                            {formErrors.description && <span className="ap-field-error">{formErrors.description}</span> }
                        </label>

                        {/* Bullet sub-section */}
                        <div className="ap-subsection">
                            <h3 className="ap-subsection__title">Bullet</h3>
                        </div>
                        <div className="ap-form__row">
                            <label className="ap-label">
                                Brand
                                <input className={`ap-input ${bulletErrors.brand ? 'ap-input--error' : ''}`}
                                       value={bulletForm.brand}
                                       onChange={e => {setBulletForm(p => ({ ...p, brand: e.target.value }))
                                           if (bulletErrors.brand) setBulletErrors(p => ({ ...p, brand: '' }))
                                       }} />
                                {bulletErrors.brand && <span className="ap-field-error">{bulletErrors.brand}</span>}
                            </label>
                            <label className="ap-label">
                                Weight
                                <input className={`ap-input ${bulletErrors.weight ? 'ap-input--error' : ''}`}
                                       value={bulletForm.weight}
                                       onChange={e => {setBulletForm(p => ({ ...p, weight: e.target.value }))
                                           if (bulletErrors.weight) setBulletErrors(p => ({ ...p, weight: '' }))
                                       }} />
                                {bulletErrors.weight && <span className="ap-field-error">{bulletErrors.weight}</span>}
                            </label>
                        </div>
                        <label className="ap-label">
                            Dimension
                            <input className={`ap-input ${bulletErrors.dimension ? 'ap-input--error' : ''}`}
                                   value={bulletForm.dimension}
                                   onChange={e => {setBulletForm(p => ({ ...p, dimension: e.target.value }))
                                       if (bulletErrors.dimension) setBulletErrors(p => ({ ...p, dimension: '' }))
                                   }} />
                            {bulletErrors.dimension && <span className="ap-field-error">{bulletErrors.dimension}</span>}
                        </label>
                        <label className="ap-label">
                            Content
                            <textarea className={`ap-input ${bulletErrors.content ? 'ap-input--error' : ''}`}
                                      rows={3}
                                      value={bulletForm.content}
                                      onChange={e => {setBulletForm(p => ({ ...p, content: e.target.value }))
                                          if (bulletErrors.content) setBulletErrors(p => ({ ...p, content: '' }))
                                      }}
                                      placeholder="Bullet point description" />
                            {bulletErrors.content && <span className="ap-field-error">{bulletErrors.content}</span>}
                        </label>
                    </form>
                </section>

                {/* Draggable divider */}
                <div
                    className={`ap-divider${isDragging ? ' ap-divider--dragging' : ''}`}
                    onMouseDown={handleDividerMouseDown}
                />

                {/* Right: Images + Shipping stacked */}
                <div className="ap-right-col" style={{ flex: 1 }} ref={rightColRef}>

                    {/* Images */}
                    <section className="ap-right-section" style={{ flex: `0 0 ${topHeight}%` }}>
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
                                            <button className="ap-btn--green-sm ap-btn--narrow" onClick={()=>startEditImage(img)}>✏️</button>
                                            <button className="ap-btn ap-btn--red-sm ap-btn--narrow" onClick={() => handleDeleteImage(img.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        <form className="ap-form" onSubmit={handleAddImage}>
                            <label className="ap-label">
                                Image URL
                                <input className={`ap-input ${imageErrors.imageUrl ? 'ap-input--error' : ''}`}
                                       value={imageUrl}
                                       onChange={e => {setImageUrl(e.target.value)
                                           if (imageErrors.imageUrl) setImageErrors(p => ({ ...p, imageUrl: '' }))
                                       }}
                                       placeholder="https://images.unsplash.com/..." required />
                                {imageErrors.imageUrl && <span className="ap-field-error">{imageErrors.imageUrl}</span>}
                            </label>
                            <label className="ap-checkbox">
                                <input type="checkbox" checked={imageIsPrimary} onChange={e => setImageIsPrimary(e.target.checked)} />
                                Set as primary image
                            </label>
                            <div className="ap-form__actions">
                                <button type="submit" className="ap-btn ap-btn--green" disabled={imageSaving || !managingImagesFor}>
                                    {imageSaving ? 'Saving...' : editingImageId ? 'Update' : 'Add'}
                                </button>
                                {editingImageId && (
                                    <button type="button" className="ap-btn ap-btn--grey" onClick={cancelEditImage}>Cancel</button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* Horizontal draggable divider */}
                    <div
                        className={`ap-h-divider${isHDragging ? ' ap-h-divider--dragging' : ''}`}
                        onMouseDown={handleHDividerMouseDown}
                    />

                    {/* Shipping */}
                    <section className="ap-right-section" style={{ flex: 1 }}>
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
                                        <td>
                                            <button className="ap-btn--green-sm ap-btn--narrow" onClick={() => startEditShipping(s)}>✏️</button>
                                            <button className="ap-btn ap-btn--red-sm ap-btn--narrow" onClick={() => handleDeleteShipping(s.id)}>🗑️</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        )}
                        <form className="ap-form" onSubmit={handleAddShipping}>
                            <label className="ap-label">
                                Support Shipping
                                <input className={`ap-input ${shippingErrors.label ? 'ap-input--error' : ''}`}
                                       value={shippingForm.label}
                                       onChange={e => {setShippingForm(p => ({ ...p, label: e.target.value }))
                                           if (shippingErrors.label) setShippingErrors(p => ({ ...p, label: '' }))
                                       }} />
                                {shippingErrors.label && <span className="ap-field-error">{shippingErrors.label}</span>}
                            </label>
                            <label className="ap-label">
                                Shipping Description
                                <input className={`ap-input ${shippingErrors.description ? 'ap-input--error' : ''}`}
                                       value={shippingForm.description}
                                       onChange={e => {setShippingForm(p => ({ ...p, description: e.target.value }))
                                           if (shippingErrors.description) setShippingErrors(p => ({ ...p, description: '' }))
                                       }} />
                                {shippingErrors.description && <span className="ap-field-error">{shippingErrors.description}</span>}
                            </label>
                            <label className="ap-checkbox">
                                <input type="checkbox" checked={shippingForm.isFree} onChange={e => setShippingForm(p => ({ ...p, isFree: e.target.checked }))} />
                                Free shipping
                            </label>
                            <div className="ap-form__actions">
                                <button type="submit" className="ap-btn ap-btn--green" disabled={shippingSaving || !managingImagesFor}>
                                    {shippingSaving ? 'Saving...' : editingShippingId ? 'Update' : 'Add'}
                                </button>
                                {editingShippingId && (
                                    <button type="button" className="ap-btn ap-btn--grey" onClick={cancelEditShipping}>Cancel</button>
                                )}
                            </div>
                        </form>
                    </section>

                </div>
            </div>

            {/* Submit row */}
            <div className="ap-submit-row">
                <button className="ap-btn ap-btn--green" onClick={handleSubmitAll} disabled={saving}>
                    {saving ? 'Saving...' : editingId == null ? 'Add' : 'Update'}
                </button>
                {editingId != null && (
                    <button className="ap-btn ap-btn--grey" onClick={cancelEdit}>
                        Cancel
                    </button>
                )}
            </div>{/* end ap-submit-row */}
            </div>{/* end top ap-editor-window */}

            {/* Products table */}
            <div className="ap-editor-window" style={{ marginTop: 16 }}>
                <h2 className="ap-editor-window__title">Products</h2>
                <section className="ap-card">
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
                            {filteredItems.map(p => (
                                <tr key={p.id}>
                                    <td>{p.id}</td>
                                    <td>{p.name}</td>
                                    <td>{p.price}</td>
                                    <td>{p.stock}</td>
                                    <td>{String(p.active)}</td>
                                    <td className="ap-table__actions">
                                        <button className="ap-btn--green-sm" onClick={() => startEdit(p)}>✏️</button>
                                        <button className="ap-btn ap-btn--red-sm" onClick={() => handleDelete(p.id)}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </div>{/* end bottom ap-editor-window */}
        </div>
    )
}