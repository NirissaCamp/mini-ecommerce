import { useState, useEffect } from 'react'
import { listOrders } from '../../api/orders.js'
import { Link } from 'react-router-dom'
import './OrderListPage.css'

function formatMoney(n) {
    if (n == null) return '—'
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(n))
}

function formatDate(iso) {
    if (!iso) return '—'
    try {
        return new Date(iso).toLocaleString()
    } catch {
        return String(iso)
    }
}

function statusClass(status) {
    const s = String(status || '').toUpperCase()
    const map = {
        PENDING:    'orders-card__badge--pending',
        PAID:       'orders-card__badge--paid',
        PROCESSING: 'orders-card__badge--processing',
        SHIPPED:    'orders-card__badge--shipped',
        DELIVERED:  'orders-card__badge--delivered',
        CLOSED:     'orders-card__badge--closed',
        CANCELLED:  'orders-card__badge--cancelled',
    }
    return `orders-card__badge ${map[s] ?? 'orders-card__badge--pending'}`
}

export default function OrderListPage({ onNeedAuth, userName }) {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const token = localStorage.getItem('token')

    async function loadOrders() {
        if (!token) {
            setOrders([])
            setLoading(false)
            return
        }
        setLoading(true)
        setError(null)
        try {
            const ordersList = await listOrders(token)
            setOrders(ordersList)
        } catch (e) {
            setError(e.message ?? 'Failed to load the orders')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadOrders()
    }, [userName])

    if (!token) {
        return (
            <div className="orders-page">
                <h1 className="orders-page__title">Your Orders</h1>
                <div className="orders-auth">
                    <p className="orders-auth__msg">Please sign in to view your orders.</p>
                    <button type="button" className="orders-auth__btn" onClick={onNeedAuth}>
                        Sign In
                    </button>
                    <Link to="/" className="orders-auth__link">
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="orders-page">
                <h1 className="orders-page__title">Your Orders</h1>
                <div className="orders-skeleton">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="orders-skeleton__row">
                            <div className="orders-skeleton__shimmer orders-skeleton__line--lg" />
                            <div className="orders-skeleton__shimmer orders-skeleton__line--sm" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="orders-page">
                <h1 className="orders-page__title">Your Orders</h1>
                <div className="orders-error" role="alert">
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="orders-page">
            <h1 className="orders-page__title">Your Orders</h1>
            <p className="orders-page__subtitle">Review your recent purchases and track order status.</p>

            {orders.length === 0 ? (
                <div className="orders-empty">
                    <div className="orders-empty__icon" aria-hidden>
                        📦
                    </div>
                    <p className="orders-empty__msg">You haven&apos;t placed any orders yet.</p>
                    <Link to="/" className="orders-empty__cta">
                        Start shopping →
                    </Link>
                </div>
            ) : (
                <ul className="orders-list">
                    {orders.map((o) => (
                        <li key={o.id}>
                            <article className="orders-card">
                                <div className="orders-card__top">
                                    <div className="orders-card__meta">
                                        <span className="orders-card__label">Order</span>
                                        <span className="orders-card__id">#{o.id}</span>
                                    </div>
                                    <span className={statusClass(o.status)}>{o.status}</span>
                                </div>
                                <div className="orders-card__mid">
                                    <div>
                                        <span className="orders-card__label">Placed</span>
                                        <p className="orders-card__value">{formatDate(o.createdAt)}</p>
                                    </div>
                                    <div>
                                        <span className="orders-card__label">Total</span>
                                        <p className="orders-card__total">{formatMoney(o.totalAmount)}</p>
                                    </div>
                                </div>
                                <div className="orders-card__actions">
                                    <Link className="orders-card__link" to={`/orders/${o.id}`}>
                                        View order details →
                                    </Link>
                                </div>
                            </article>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
