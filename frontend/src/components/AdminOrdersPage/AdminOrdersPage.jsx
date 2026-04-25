import { useState, useEffect, useMemo, useCallback } from 'react'
import {
    adminListOrders,
    adminGetOrder,
    adminUpdateOrderStatus,
    adminGetAnalytics,
    adminListReturns,
    adminGetReturn,
    adminApproveReturn,
    adminRejectReturn,
    adminConfirmRefund,
} from '../../api/adminOrders.js'
import './AdminOrdersPage.css'

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(val, decimals = 2) {
    if (val == null) return '—'
    return Number(val).toFixed(decimals)
}

function fmtDate(str) {
    if (!str) return '—'
    return new Date(str).toLocaleString()
}

function toISODate(d) {
    return d.toISOString().slice(0, 10)
}

const ORDER_STATUSES = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CLOSED', 'CANCELLED']
const RETURN_STATUSES = ['REQUESTED', 'APPROVED', 'REFUNDED', 'REJECTED']

const STATUS_TRANSITIONS = {
    PENDING:    ['PAID', 'CANCELLED'],
    PAID:       ['PROCESSING', 'CANCELLED'],
    PROCESSING: ['SHIPPED', 'CANCELLED'],
    SHIPPED:    ['DELIVERED'],
    DELIVERED:  ['CLOSED'],
    CLOSED:     [],
    CANCELLED:  [],
}

// ── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    return (
        <span className={`aop-badge aop-badge--${status?.toLowerCase()}`}>
            {status ?? '—'}
        </span>
    )
}

// ── Pagination Bar ──────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onPage }) {
    if (totalPages <= 1) return null
    return (
        <div className="aop-pagination">
            <button
                className="aop-btn aop-btn--sm"
                onClick={() => onPage(page - 1)}
                disabled={page === 0}
            >
                Prev
            </button>
            <span className="aop-pagination__info">
                Page {page + 1} / {totalPages}
            </span>
            <button
                className="aop-btn aop-btn--sm"
                onClick={() => onPage(page + 1)}
                disabled={page >= totalPages - 1}
            >
                Next
            </button>
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 1 — ORDERS
// ══════════════════════════════════════════════════════════════════════════════

function OrdersTab({ token }) {
    const [orders, setOrders] = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(0)
    const [statusFilter, setStatusFilter] = useState('')
    const [userIdFilter, setUserIdFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [selectedOrderId, setSelectedOrderId] = useState(null)
    const [listKey, setListKey] = useState(0)

    const loadOrders = useCallback(
        async (p, status, userId) => {
            setLoading(true)
            setError(null)
            try {
                const params = { page: p, size: 20 }
                if (status) params.status = status
                if (userId.trim()) params.userId = userId.trim()
                const data = await adminListOrders(token, params)
                setOrders(data?.content ?? [])
                setTotalPages(data?.totalPages ?? 1)
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        },
        [token]
    )

    useEffect(() => {
        loadOrders(page, statusFilter, userIdFilter)
    }, [loadOrders, page, statusFilter, userIdFilter, listKey])

    function handleStatusFilter(e) {
        setStatusFilter(e.target.value)
        setPage(0)
    }

    function handleUserIdFilter(e) {
        setUserIdFilter(e.target.value)
        setPage(0)
    }

    function handlePage(p) {
        setPage(p)
    }

    function refreshList() {
        setListKey(k => k + 1)
    }

    return (
        <div className="aop-split-layout">
            {/* Left: order list */}
            <div className="aop-card aop-list-panel">
                <h2 className="aop-card__title">Orders</h2>

                <div className="aop-filter-bar">
                    <select
                        className="aop-select"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                    >
                        <option value="">All Statuses</option>
                        {ORDER_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                    <input
                        className="aop-input"
                        type="text"
                        placeholder="User ID"
                        value={userIdFilter}
                        onChange={handleUserIdFilter}
                    />
                </div>

                {error && <div className="aop-error">{error}</div>}

                {loading ? (
                    <div className="aop-state">Loading…</div>
                ) : orders.length === 0 ? (
                    <div className="aop-state">No orders found.</div>
                ) : (
                    <>
                        <div className="aop-table-wrap">
                            <table className="aop-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th className="aop-num">Total</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr
                                            key={order.id}
                                            className={`aop-row${order.id === selectedOrderId ? ' aop-row--selected' : ''}`}
                                            onClick={() => setSelectedOrderId(order.id)}
                                        >
                                            <td className="aop-nowrap">#{order.id}</td>
                                            <td>{order.username ?? '—'}</td>
                                            <td><StatusBadge status={order.status} /></td>
                                            <td className="aop-num">${fmt(order.totalAmount)}</td>
                                            <td className="aop-nowrap">{fmtDate(order.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPage={handlePage} />
                    </>
                )}
            </div>

            {/* Right: order detail */}
            <OrderDetailPanel
                token={token}
                orderId={selectedOrderId}
                onOrderUpdated={refreshList}
            />
        </div>
    )
}

function OrderDetailPanel({ token, orderId, onOrderUpdated }) {
    const [order, setOrder] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [nextStatus, setNextStatus] = useState('')
    const [updating, setUpdating] = useState(false)
    const [updateError, setUpdateError] = useState(null)

    const loadOrder = useCallback(async () => {
        if (!orderId) return
        setLoading(true)
        setError(null)
        try {
            const data = await adminGetOrder(token, orderId)
            setOrder(data)
            const transitions = STATUS_TRANSITIONS[data.status] ?? []
            setNextStatus(transitions[0] ?? '')
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [token, orderId])

    useEffect(() => {
        setOrder(null)
        setUpdateError(null)
        loadOrder()
    }, [loadOrder])

    async function handleStatusUpdate() {
        if (!nextStatus) return
        setUpdating(true)
        setUpdateError(null)
        try {
            await adminUpdateOrderStatus(token, orderId, nextStatus)
            await loadOrder()
            onOrderUpdated()
        } catch (e) {
            setUpdateError(e.message)
        } finally {
            setUpdating(false)
        }
    }

    if (!orderId) {
        return (
            <div className="aop-card aop-detail-panel aop-detail-panel--empty">
                <p className="aop-state">Select an order to view details.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="aop-card aop-detail-panel">
                <div className="aop-state">Loading…</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="aop-card aop-detail-panel">
                <div className="aop-error">{error}</div>
            </div>
        )
    }

    if (!order) return null

    const transitions = STATUS_TRANSITIONS[order.status] ?? []

    return (
        <div className="aop-card aop-detail-panel">
            {/* Order header */}
            <div className="aop-detail-header">
                <div className="aop-detail-title-row">
                    <h2 className="aop-card__title">Order #{order.id}</h2>
                    <StatusBadge status={order.status} />
                </div>
                <div className="aop-detail-meta">
                    <span><strong>Customer:</strong> {order.username ?? '—'}</span>
                    <span><strong>Email:</strong> {order.userEmail ?? '—'}</span>
                    <span><strong>Date:</strong> {fmtDate(order.createdAt)}</span>
                    <span><strong>Total:</strong> ${fmt(order.totalAmount)}</span>
                </div>
            </div>

            {/* Items table */}
            <div className="aop-section">
                <h3 className="aop-section__title">Items</h3>
                {order.items?.length > 0 ? (
                    <div className="aop-table-wrap">
                        <table className="aop-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th className="aop-num">Unit Price</th>
                                    <th className="aop-num">Qty</th>
                                    <th className="aop-num">Line Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map(item => (
                                    <tr key={item.productId} className="aop-row aop-row--static">
                                        <td>{item.productName}</td>
                                        <td className="aop-num">${fmt(item.unitPrice)}</td>
                                        <td className="aop-num">{item.quantity}</td>
                                        <td className="aop-num">${fmt(item.lineTotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="aop-state">No items.</div>
                )}
            </div>

            {/* Status update */}
            {transitions.length > 0 && (
                <div className="aop-section aop-status-update">
                    <h3 className="aop-section__title">Update Status</h3>
                    {updateError && <div className="aop-error">{updateError}</div>}
                    <div className="aop-status-update-row">
                        <select
                            className="aop-select"
                            value={nextStatus}
                            onChange={e => setNextStatus(e.target.value)}
                        >
                            {transitions.map(s => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                        <button
                            className="aop-btn aop-btn--primary"
                            onClick={handleStatusUpdate}
                            disabled={updating || !nextStatus}
                        >
                            {updating ? 'Updating…' : `Move to ${nextStatus}`}
                        </button>
                    </div>
                </div>
            )}

            {transitions.length === 0 && (
                <div className="aop-section">
                    <p className="aop-state aop-state--inline">No further status transitions available.</p>
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 2 — RETURNS
// ══════════════════════════════════════════════════════════════════════════════

function ReturnsTab({ token }) {
    const [returns, setReturns] = useState([])
    const [totalPages, setTotalPages] = useState(1)
    const [page, setPage] = useState(0)
    const [statusFilter, setStatusFilter] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [selectedReturnId, setSelectedReturnId] = useState(null)
    const [listKey, setListKey] = useState(0)

    const loadReturns = useCallback(
        async (p, status) => {
            setLoading(true)
            setError(null)
            try {
                const params = { page: p, size: 20 }
                if (status) params.status = status
                const data = await adminListReturns(token, params)
                setReturns(data?.content ?? [])
                setTotalPages(data?.totalPages ?? 1)
            } catch (e) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        },
        [token]
    )

    useEffect(() => {
        loadReturns(page, statusFilter)
    }, [loadReturns, page, statusFilter, listKey])

    function handleStatusFilter(e) {
        setStatusFilter(e.target.value)
        setPage(0)
    }

    function refreshList() {
        setListKey(k => k + 1)
    }

    return (
        <div className="aop-split-layout">
            {/* Left: returns list */}
            <div className="aop-card aop-list-panel">
                <h2 className="aop-card__title">Returns</h2>

                <div className="aop-filter-bar">
                    <select
                        className="aop-select"
                        value={statusFilter}
                        onChange={handleStatusFilter}
                    >
                        <option value="">All Statuses</option>
                        {RETURN_STATUSES.map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </div>

                {error && <div className="aop-error">{error}</div>}

                {loading ? (
                    <div className="aop-state">Loading…</div>
                ) : returns.length === 0 ? (
                    <div className="aop-state">No returns found.</div>
                ) : (
                    <>
                        <div className="aop-table-wrap">
                            <table className="aop-table">
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Order #</th>
                                        <th>Customer</th>
                                        <th>Status</th>
                                        <th>Requested At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {returns.map(ret => (
                                        <tr
                                            key={ret.id}
                                            className={`aop-row${ret.id === selectedReturnId ? ' aop-row--selected' : ''}`}
                                            onClick={() => setSelectedReturnId(ret.id)}
                                        >
                                            <td className="aop-nowrap">#{ret.id}</td>
                                            <td className="aop-nowrap">#{ret.orderId}</td>
                                            <td>{ret.username ?? '—'}</td>
                                            <td><StatusBadge status={ret.status} /></td>
                                            <td className="aop-nowrap">{fmtDate(ret.requestedAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
                    </>
                )}
            </div>

            {/* Right: return detail */}
            <ReturnDetailPanel
                token={token}
                returnId={selectedReturnId}
                onReturnUpdated={refreshList}
            />
        </div>
    )
}

function ReturnDetailPanel({ token, returnId, onReturnUpdated }) {
    const [ret, setRet] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Reject inline state
    const [showRejectInput, setShowRejectInput] = useState(false)
    const [rejectReason, setRejectReason] = useState('')
    const [rejecting, setRejecting] = useState(false)
    const [rejectError, setRejectError] = useState(null)

    // Refund inline state
    const [showRefundInput, setShowRefundInput] = useState(false)
    const [refundAmount, setRefundAmount] = useState('')
    const [refunding, setRefunding] = useState(false)
    const [refundError, setRefundError] = useState(null)

    const [actionError, setActionError] = useState(null)
    const [actioning, setActioning] = useState(false)

    const loadReturn = useCallback(async () => {
        if (!returnId) return
        setLoading(true)
        setError(null)
        try {
            const data = await adminGetReturn(token, returnId)
            setRet(data)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }, [token, returnId])

    useEffect(() => {
        setRet(null)
        setActionError(null)
        setShowRejectInput(false)
        setRejectReason('')
        setRejectError(null)
        setShowRefundInput(false)
        setRefundAmount('')
        setRefundError(null)
        loadReturn()
    }, [loadReturn])

    async function handleApprove() {
        setActioning(true)
        setActionError(null)
        try {
            await adminApproveReturn(token, returnId)
            await loadReturn()
            onReturnUpdated()
        } catch (e) {
            setActionError(e.message)
        } finally {
            setActioning(false)
        }
    }

    async function handleReject() {
        if (!rejectReason.trim()) {
            setRejectError('Reason is required.')
            return
        }
        setRejecting(true)
        setRejectError(null)
        try {
            await adminRejectReturn(token, returnId, rejectReason.trim())
            await loadReturn()
            onReturnUpdated()
            setShowRejectInput(false)
            setRejectReason('')
        } catch (e) {
            setRejectError(e.message)
        } finally {
            setRejecting(false)
        }
    }

    async function handleConfirmRefund() {
        const amount = parseFloat(refundAmount)
        if (isNaN(amount) || amount <= 0) {
            setRefundError('Enter a valid positive refund amount.')
            return
        }
        setRefunding(true)
        setRefundError(null)
        try {
            await adminConfirmRefund(token, returnId, amount)
            await loadReturn()
            onReturnUpdated()
            setShowRefundInput(false)
            setRefundAmount('')
        } catch (e) {
            setRefundError(e.message)
        } finally {
            setRefunding(false)
        }
    }

    if (!returnId) {
        return (
            <div className="aop-card aop-detail-panel aop-detail-panel--empty">
                <p className="aop-state">Select a return to view details.</p>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="aop-card aop-detail-panel">
                <div className="aop-state">Loading…</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="aop-card aop-detail-panel">
                <div className="aop-error">{error}</div>
            </div>
        )
    }

    if (!ret) return null

    return (
        <div className="aop-card aop-detail-panel">
            {/* Return header */}
            <div className="aop-detail-header">
                <div className="aop-detail-title-row">
                    <h2 className="aop-card__title">Return #{ret.id}</h2>
                    <StatusBadge status={ret.status} />
                </div>
                <div className="aop-detail-meta">
                    <span><strong>Order:</strong> #{ret.orderId}</span>
                    <span><strong>Customer:</strong> {ret.username ?? '—'}</span>
                    <span><strong>Reason:</strong> {ret.reason ?? '—'}</span>
                    <span><strong>Requested:</strong> {fmtDate(ret.requestedAt)}</span>
                    {ret.resolvedAt && (
                        <span><strong>Resolved:</strong> {fmtDate(ret.resolvedAt)}</span>
                    )}
                    {ret.resolvedBy && (
                        <span><strong>Resolved by:</strong> {ret.resolvedBy}</span>
                    )}
                    {ret.refundAmount != null && (
                        <span><strong>Refund Amount:</strong> ${fmt(ret.refundAmount)}</span>
                    )}
                </div>
            </div>

            {/* Items table */}
            <div className="aop-section">
                <h3 className="aop-section__title">Items</h3>
                {ret.items?.length > 0 ? (
                    <div className="aop-table-wrap">
                        <table className="aop-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th className="aop-num">Qty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ret.items.map(item => (
                                    <tr key={item.id} className="aop-row aop-row--static">
                                        <td>{item.productName}</td>
                                        <td className="aop-num">{item.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="aop-state">No items.</div>
                )}
            </div>

            {/* Actions */}
            {actionError && <div className="aop-error">{actionError}</div>}

            {ret.status === 'REQUESTED' && (
                <div className="aop-section">
                    <h3 className="aop-section__title">Actions</h3>
                    <div className="aop-actions-row">
                        <button
                            className="aop-btn aop-btn--primary"
                            onClick={handleApprove}
                            disabled={actioning}
                        >
                            {actioning ? 'Approving…' : 'Approve'}
                        </button>

                        {!showRejectInput ? (
                            <button
                                className="aop-btn aop-btn--danger"
                                onClick={() => setShowRejectInput(true)}
                                disabled={actioning}
                            >
                                Reject
                            </button>
                        ) : (
                            <div className="aop-inline-form">
                                {rejectError && <div className="aop-error">{rejectError}</div>}
                                <input
                                    className="aop-input"
                                    type="text"
                                    placeholder="Rejection reason *"
                                    value={rejectReason}
                                    onChange={e => setRejectReason(e.target.value)}
                                />
                                <div className="aop-inline-form-actions">
                                    <button
                                        className="aop-btn aop-btn--danger"
                                        onClick={handleReject}
                                        disabled={rejecting}
                                    >
                                        {rejecting ? 'Rejecting…' : 'Confirm Reject'}
                                    </button>
                                    <button
                                        className="aop-btn"
                                        onClick={() => { setShowRejectInput(false); setRejectReason(''); setRejectError(null) }}
                                        disabled={rejecting}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {ret.status === 'APPROVED' && (
                <div className="aop-section">
                    <h3 className="aop-section__title">Actions</h3>
                    {!showRefundInput ? (
                        <button
                            className="aop-btn aop-btn--primary"
                            onClick={() => setShowRefundInput(true)}
                        >
                            Confirm Refund
                        </button>
                    ) : (
                        <div className="aop-inline-form">
                            {refundError && <div className="aop-error">{refundError}</div>}
                            <input
                                className="aop-input aop-input--narrow"
                                type="number"
                                min="0.01"
                                step="0.01"
                                placeholder="Refund amount *"
                                value={refundAmount}
                                onChange={e => setRefundAmount(e.target.value)}
                            />
                            <div className="aop-inline-form-actions">
                                <button
                                    className="aop-btn aop-btn--primary"
                                    onClick={handleConfirmRefund}
                                    disabled={refunding}
                                >
                                    {refunding ? 'Processing…' : 'Submit Refund'}
                                </button>
                                <button
                                    className="aop-btn"
                                    onClick={() => { setShowRefundInput(false); setRefundAmount(''); setRefundError(null) }}
                                    disabled={refunding}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// TAB 3 — ANALYTICS
// ══════════════════════════════════════════════════════════════════════════════

function AnalyticsTab({ token }) {
    const defaultTo = toISODate(new Date())
    const defaultFrom = toISODate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))

    const [from, setFrom] = useState(defaultFrom)
    const [to, setTo] = useState(defaultTo)
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    async function handleLoad() {
        setLoading(true)
        setError(null)
        setAnalytics(null)
        try {
            const data = await adminGetAnalytics(token, from, to)
            setAnalytics(data)
        } catch (e) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    const ordersByStatus = analytics?.ordersByStatus
        ? Object.entries(analytics.ordersByStatus)
        : []

    return (
        <div className="aop-card aop-analytics-panel">
            <h2 className="aop-card__title">Order Analytics</h2>

            <div className="aop-filter-bar">
                <label className="aop-label-inline">
                    From
                    <input
                        className="aop-input aop-input--date"
                        type="date"
                        value={from}
                        onChange={e => setFrom(e.target.value)}
                    />
                </label>
                <label className="aop-label-inline">
                    To
                    <input
                        className="aop-input aop-input--date"
                        type="date"
                        value={to}
                        onChange={e => setTo(e.target.value)}
                    />
                </label>
                <button
                    className="aop-btn aop-btn--primary"
                    onClick={handleLoad}
                    disabled={loading}
                >
                    {loading ? 'Loading…' : 'Load'}
                </button>
            </div>

            {error && <div className="aop-error">{error}</div>}

            {!analytics && !loading && !error && (
                <div className="aop-state">Select a date range and click Load.</div>
            )}

            {analytics && (
                <>
                    <div className="aop-stats-grid">
                        <div className="aop-stat-card">
                            <span className="aop-stat-card__label">Total Orders</span>
                            <span className="aop-stat-card__value">{analytics.totalOrders ?? '—'}</span>
                        </div>
                        <div className="aop-stat-card">
                            <span className="aop-stat-card__label">Total Revenue</span>
                            <span className="aop-stat-card__value">${fmt(analytics.totalRevenue)}</span>
                        </div>
                        <div className="aop-stat-card">
                            <span className="aop-stat-card__label">Avg Order Value</span>
                            <span className="aop-stat-card__value">${fmt(analytics.avgOrderValue)}</span>
                        </div>
                        <div className="aop-stat-card">
                            <span className="aop-stat-card__label">Total Returns</span>
                            <span className="aop-stat-card__value">{analytics.totalReturns ?? '—'}</span>
                        </div>
                        <div className="aop-stat-card">
                            <span className="aop-stat-card__label">Return Rate</span>
                            <span className="aop-stat-card__value">
                                {analytics.returnRate != null ? `${fmt(analytics.returnRate, 1)}%` : '—'}
                            </span>
                        </div>
                    </div>

                    <div className="aop-section">
                        <h3 className="aop-section__title">Orders by Status</h3>
                        {ordersByStatus.length === 0 ? (
                            <div className="aop-state">No breakdown available.</div>
                        ) : (
                            <div className="aop-table-wrap">
                                <table className="aop-table aop-table--compact">
                                    <thead>
                                        <tr>
                                            <th>Status</th>
                                            <th className="aop-num">Count</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ordersByStatus.map(([status, count]) => (
                                            <tr key={status} className="aop-row aop-row--static">
                                                <td><StatusBadge status={status} /></td>
                                                <td className="aop-num">{count}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    )
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE ROOT
// ══════════════════════════════════════════════════════════════════════════════

const TABS = [
    { key: 'orders', label: 'Orders' },
    { key: 'returns', label: 'Returns' },
    { key: 'analytics', label: 'Analytics' },
]

export default function AdminOrdersPage() {
    const token = useMemo(() => localStorage.getItem('token'), [])
    const [activeTab, setActiveTab] = useState('orders')

    return (
        <div className="aop-page">
            <h1 className="aop-title">Order Management</h1>

            <div className="aop-tabs">
                {TABS.map(tab => (
                    <button
                        key={tab.key}
                        className={`aop-tab${activeTab === tab.key ? ' aop-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="aop-tab-content">
                {activeTab === 'orders' && <OrdersTab token={token} />}
                {activeTab === 'returns' && <ReturnsTab token={token} />}
                {activeTab === 'analytics' && <AnalyticsTab token={token} />}
            </div>
        </div>
    )
}
