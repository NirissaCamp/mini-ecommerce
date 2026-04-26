import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    adminListInventory,
    adminGetMovements,
    adminReceiveStock,
    adminAdjustStock,
} from '../../api/adminInventory.js'
import './AdminInventoryPage.css'

function fmt(val, decimals = 2) {
    if (val == null) return '—'
    return Number(val).toFixed(decimals)
}

function fmtDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleString()
}

// ── Receive Stock Form ─────────────────────────────────────────────────────

function ReceiveStockForm({ token, productId, sellingPrice, onSuccess }) {
    const [qty, setQty] = useState('')
    const [unitCost, setUnitCost] = useState('')
    const [note, setNote] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        if (!qty || Number(qty) <= 0) {
            setError('Qty must be a positive number.')
            return
        }
        if (unitCost === '' || Number.isNaN(Number(unitCost))) {
            setError('Unit cost is required.')
            return
        }
        if (Number(unitCost) <= 0) {
            setError('Unit cost must be greater than 0.')
            return
        }
        if (sellingPrice != null && Number(unitCost) > Number(sellingPrice)) {
            setError('Unit cost cannot exceed selling price.')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            const body = {
                qty: Number(qty),
                unitCost: Number(unitCost),
            }
            if (note.trim()) body.note = note.trim()
            await adminReceiveStock(token, productId, body)
            setQty('')
            setUnitCost('')
            setNote('')
            onSuccess()
        } catch (e) {
//             e.status === 401 || e.status === 403
//             -> 走“登录失效”流程（清 token、弹登录、或跳登录页）
             if (e.status === 401 || e.status === 403) {
                 setError('Session expired or permission denied. Please sign in again.')
                 // 可选：localStorage.removeItem('token')
                 // 可选：window.location.href = '/'
             }
//          其他错误
//          -> 继续 setError(e.message) 普通提示
             else {
                 setError(e.message ?? 'Request failed')
             }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form className="aip-subform" onSubmit={handleSubmit}>
            <h3 className="aip-subform__title">Receive Stock</h3>
            {error && <div className="aip-error">{error}</div>}
            <div className="aip-form-row">
                <label className="aip-label">
                    Qty *
                    <input
                        className="aip-input"
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={qty}
                        onChange={e => setQty(e.target.value)}
                    />
                </label>
                <label className="aip-label">
                    Unit Cost ($) *
                    <input
                        className="aip-input"
                        type="number"
                        min="0"
                        step="0.01"
                        value={unitCost}
                        onChange={e => setUnitCost(e.target.value)}
                        placeholder="required"
                    />
                </label>
            </div>
            <label className="aip-label">
                Note
                <input
                    className="aip-input"
                    type="text"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="optional"
                />
            </label>
            <div className="aip-form-actions">
                <button className="aip-btn aip-btn--primary" type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Receive'}
                </button>
            </div>
        </form>
    )
}

// ── Adjust Stock Form ──────────────────────────────────────────────────────

function AdjustStockForm({ token, productId, onSuccess }) {
    const [delta, setDelta] = useState('')
    const [reason, setReason] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)

    async function handleSubmit(e) {
        e.preventDefault()
        if (delta === '' || isNaN(Number(delta))) {
            setError('Delta is required.')
            return
        }
        if (!reason.trim()) {
            setError('Reason is required.')
            return
        }
        setSubmitting(true)
        setError(null)
        try {
            await adminAdjustStock(token, productId, { delta: Number(delta), reason: reason.trim() })
            setDelta('')
            setReason('')
            onSuccess()
        } catch (e) {
            if (e.status === 401 || e.status === 403) {
                setError('Session expired or permission denied. Please sign in again.')
                // 可选：localStorage.removeItem('token')
                // 可选：window.location.href = '/'
            } else {
                setError(e.message ?? 'Request failed')
            }
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form className="aip-subform" onSubmit={handleSubmit}>
            <h3 className="aip-subform__title">Manual Adjust</h3>
            {error && <div className="aip-error">{error}</div>}
            <div className="aip-form-row">
                <label className="aip-label">
                    Delta *
                    <input
                        className="aip-input"
                        type="number"
                        step="1"
                        required
                        value={delta}
                        onChange={e => setDelta(e.target.value)}
                        placeholder="e.g. -3 or +5"
                    />
                </label>
                <label className="aip-label">
                    Reason *
                    <input
                        className="aip-input"
                        type="text"
                        required
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="required"
                    />
                </label>
            </div>
            <div className="aip-form-actions">
                <button className="aip-btn aip-btn--primary" type="submit" disabled={submitting}>
                    {submitting ? 'Saving…' : 'Adjust'}
                </button>
            </div>
        </form>
    )
}

// ── Movements Table ────────────────────────────────────────────────────────

function MovementsTable({ token, productId }) {
    const [page, setPage] = useState(0)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const load = useCallback(
        async (p) => {
            setLoading(true)
            setError(null)
            try {
                const result = await adminGetMovements(token, productId, p, 20)
                setData(result)
            } catch (e) {
                if (e.status === 401 || e.status === 403) {
                    setError('Session expired or permission denied. Please sign in again.')
                    // 可选：localStorage.removeItem('token')
                    // 可选：window.location.href = '/'
                } else {
                    setError(e.message ?? 'Request failed')
                }
            } finally {
                setLoading(false)
            }
        },
        [token, productId]
    )

    useEffect(() => {
        setPage(0)
        load(0)
    }, [load])

    function goPage(p) {
        setPage(p)
        load(p)
    }

    const movements = data?.content ?? []
    const totalPages = data?.totalPages ?? 1

    return (
        <div className="aip-movements">
            <h3 className="aip-subform__title">Stock Movements</h3>
            {error && <div className="aip-error">{error}</div>}
            {loading ? (
                <div className="aip-state">Loading…</div>
            ) : movements.length === 0 ? (
                <div className="aip-state">No movements recorded.</div>
            ) : (
                <>
                    <div className="aip-table-wrap aip-table-wrap--movements">
                        <table className="aip-table aip-table--movements">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Type</th>
                                    <th className="aip-num">Qty Change</th>
                                    <th className="aip-num">Unit Cost</th>
                                    <th className="aip-num">On Hand After</th>
                                    <th className="aip-num">Allocated After</th>
                                    <th className="aip-num">Available After</th>
                                    <th>Reference</th>
                                    <th>Note</th>
                                </tr>
                            </thead>
                            <tbody>
                                {movements.map(m => (
                                    <tr key={m.id} className="aip-row">
                                        <td className="aip-nowrap">{fmtDate(m.createdAt)}</td>
                                        <td>
                                            <span className={`aip-badge aip-badge--${m.movementType?.toLowerCase()}`}>
                                                {m.movementType}
                                            </span>
                                        </td>
                                        <td className={`aip-num ${m.qtyChange >= 0 ? 'aip-positive' : 'aip-negative'}`}>
                                            {m.qtyChange >= 0 ? `+${m.qtyChange}` : m.qtyChange}
                                        </td>
                                        <td className="aip-num">
                                            {m.movementType === 'RECEIVE' && m.unitCost != null
                                                ? `$${fmt(m.unitCost)}`
                                                : '—'}
                                        </td>
                                        <td className="aip-num">{m.onHandAfter}</td>
                                        <td className="aip-num">{m.allocatedAfter}</td>
                                        <td className="aip-num">{m.availableAfter}</td>
                                        <td className="aip-ref">
                                            {m.referenceType ? `${m.referenceType}${m.referenceId ? ' #' + m.referenceId : ''}` : '—'}
                                        </td>
                                        <td>{m.note ?? '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="aip-pagination">
                            <button
                                className="aip-btn aip-btn--sm"
                                onClick={() => goPage(page - 1)}
                                disabled={page === 0}
                            >
                                Prev
                            </button>
                            <span className="aip-pagination__info">
                                Page {page + 1} / {totalPages}
                            </span>
                            <button
                                className="aip-btn aip-btn--sm"
                                onClick={() => goPage(page + 1)}
                                disabled={page >= totalPages - 1}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}

// ── Detail Panel (right panel) ─────────────────────────────────────────────

function DetailPanel({ token, productId, inventory, onStockChanged }) {
    const [refreshKey, setRefreshKey] = useState(0)

    function handleSuccess() {
        setRefreshKey(k => k + 1)
        onStockChanged()
    }

    if (!productId) {
        return (
            <div className="aip-card aip-detail-panel aip-detail-panel--empty">
                <p className="aip-state">Select a product to view details.</p>
            </div>
        )
    }

    return (
        <div className="aip-card aip-detail-panel">
            {/* Summary */}
            {inventory && (
                <div className="aip-summary">
                    <h2 className="aip-card__title">{inventory.productName}</h2>
                    <div className="aip-summary-grid">
                        <div className="aip-summary-item">
                            <span className="aip-summary-item__label">On Hand</span>
                            <span className="aip-summary-item__value">{inventory.onHandQty}</span>
                        </div>
                        <div className="aip-summary-item">
                            <span className="aip-summary-item__label">Available</span>
                            <span className="aip-summary-item__value">{inventory.availableQty}</span>
                        </div>
                        <div className="aip-summary-item">
                            <span className="aip-summary-item__label">Allocated</span>
                            <span className="aip-summary-item__value">{inventory.allocatedQty}</span>
                        </div>
                        <div className="aip-summary-item">
                            <span className="aip-summary-item__label">Cost</span>
                            <span className="aip-summary-item__value">
                                {inventory.costPrice != null ? `$${fmt(inventory.costPrice)}` : '—'}
                            </span>
                        </div>
                        <div className="aip-summary-item">
                            <span className="aip-summary-item__label">Price</span>
                            <span className="aip-summary-item__value">${fmt(inventory.sellingPrice)}</span>
                        </div>
                        <div className="aip-summary-item">
                            <span className="aip-summary-item__label">Margin</span>
                            <span className="aip-summary-item__value">
                                {inventory.marginPct != null ? `${fmt(inventory.marginPct, 1)}%` : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div className="aip-forms-row">
                <ReceiveStockForm
                  key={`recv-${productId}-${refreshKey}`}
                  token={token}
                  productId={productId}
                  sellingPrice={inventory?.sellingPrice}
                  onSuccess={handleSuccess}
                />
                <AdjustStockForm key={`adj-${productId}-${refreshKey}`} token={token} productId={productId} onSuccess={handleSuccess} />
            </div>

            <MovementsTable key={`mv-${productId}-${refreshKey}`} token={token} productId={productId} />
        </div>
    )
}

// ── Page Root ──────────────────────────────────────────────────────────────

export default function AdminInventoryPage() {
    const token = useMemo(() => localStorage.getItem('token'), [])
    const [selectedId, setSelectedId] = useState(null)
    const [allItems, setAllItems] = useState([])
    const [listRefreshKey, setListRefreshKey] = useState(0)

    const selectedInventory = useMemo(
        () => allItems.find(i => i.productId === selectedId) ?? null,
        [allItems, selectedId]
    )

    return (
        <div className="aip-page">
            <h1 className="aip-title">Inventory Management</h1>
            <div className="aip-layout">
                <InventoryList
                    token={token}
                    selectedId={selectedId}
                    onSelect={setSelectedId}
                    onItemsLoaded={setAllItems}
                    listRefreshKey={listRefreshKey}
                />
                <DetailPanel
                    token={token}
                    productId={selectedId}
                    inventory={selectedInventory}
                    onStockChanged={() => setListRefreshKey(k => k + 1)}
                />
            </div>
        </div>
    )
}

function InventoryList({ token, selectedId, onSelect, onItemsLoaded, listRefreshKey }) {
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [keyword, setKeyword] = useState('')
    const [lowStock, setLowStock] = useState('')

    const load = useCallback(
        async (kw, ls) => {
            setLoading(true)
            setError(null)
            try {
                const params = {}
                if (kw.trim()) params.keyword = kw.trim()
                if (ls !== '' && !isNaN(Number(ls))) params.lowStock = Number(ls)
                const data = await adminListInventory(token, params)
                const arr = Array.isArray(data) ? data : []
                setItems(arr)
                onItemsLoaded(arr)
            } catch (e) {
                if (e.status === 401 || e.status === 403) {
                    setError('Session expired or permission denied. Please sign in again.')
                    // 可选：localStorage.removeItem('token')
                    // 可选：window.location.href = '/'
                } else {
                    setError(e.message ?? 'Request failed')
                }
            } finally {
                setLoading(false)
            }
        },
        [token, onItemsLoaded]
    )

    useEffect(() => {
        load(keyword, lowStock)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listRefreshKey])

    //  items 是当前筛选结果
    //  selectedId 是右侧详情正在看的商品
    //  筛选变化后，如果该商品不在 items 里，右侧继续显示会造成“左空右有”的语义冲突
    //  所以自动清空是最自然的交互。
    useEffect(() => {
        if (selectedId == null) return
        const stillExists = items.some(item => item.productId === selectedId)
        if (!stillExists) {
            onSelect(null)
        }
    }, [items, selectedId, onSelect])

    function handleSearch(e) {
        e.preventDefault()
        load(keyword, lowStock)
    }

    return (
        <div className="aip-card aip-list-panel">
            <h2 className="aip-card__title">Inventory</h2>

            <form className="aip-filter-bar" onSubmit={handleSearch}>
                <input
                    className="aip-input"
                    placeholder="Search product…"
                    value={keyword}
                    onChange={e => setKeyword(e.target.value)}
                />
                <input
                    className="aip-input aip-input--narrow"
                    type="number"
                    min="0"
                    placeholder="Low stock ≤"
                    value={lowStock}
                    onChange={e => setLowStock(e.target.value)}
                />
                <button className="aip-btn aip-btn--primary" type="submit">
                    Search
                </button>
            </form>

            {error && <div className="aip-error">{error}</div>}

            {loading ? (
                <div className="aip-state">Loading…</div>
            ) : items.length === 0 ? (
                <div className="aip-state">No inventory records found.</div>
            ) : (
                <div className="aip-table-wrap">
                    <table className="aip-table">
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th className="aip-num">On Hand</th>
                                <th className="aip-num">Available</th>
                                <th className="aip-num">Allocated</th>
                                <th className="aip-num">Cost</th>
                                <th className="aip-num">Price</th>
                                <th className="aip-num">Margin</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr
                                    key={item.productId}
                                    className={`aip-row${item.productId === selectedId ? ' aip-row--selected' : ''}`}
                                    onClick={() => onSelect(item.productId)}
                                >
                                    <td>{item.productName}</td>
                                    <td className="aip-num">{item.onHandQty}</td>
                                    <td className="aip-num">{item.availableQty}</td>
                                    <td className="aip-num">{item.allocatedQty}</td>
                                    <td className="aip-num">{item.costPrice != null ? `$${fmt(item.costPrice)}` : '—'}</td>
                                    <td className="aip-num">${fmt(item.sellingPrice)}</td>
                                    <td className="aip-num">{item.marginPct != null ? `${fmt(item.marginPct, 1)}%` : '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
