import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getCart, updateCartItem, removeCartItem, clearCart } from '../../api/cart'
import './Cart.css'

const COLORS = [
    { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', text: '#1d4ed8' },
    { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', text: '#15803d' },
    { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', text: '#b45309' },
    { bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', text: '#be185d' },
    { bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', text: '#6d28d9' },
    { bg: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', text: '#0369a1' },
    { bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)', text: '#c2410c' },
    { bg: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', text: '#166534' },
]
const getColor = id => COLORS[(id - 1) % COLORS.length]

function SkeletonRow() {
    return (
        <div className="cart-skeleton-row">
            <div className="cart-shimmer cart-skeleton-row__img" />
            <div className="cart-skeleton-row__lines">
                <div className="cart-shimmer" style={{ width: '60%', height: 16, borderRadius: 4 }} />
                <div className="cart-shimmer" style={{ width: '30%', height: 14, borderRadius: 4, marginTop: 8 }} />
            </div>
            <div className="cart-shimmer cart-skeleton-row__qty" />
            <div className="cart-shimmer cart-skeleton-row__price" />
        </div>
    )
}

export default function Cart({ onCartUpdate, onNeedAuth }) {
    const [items,   setItems]   = useState([])
    const [loading, setLoading] = useState(true)
    const [error,   setError]   = useState(null)
    const [busy,    setBusy]    = useState(new Set())

    const totalItems    = items.reduce((sum, i) => sum + i.quantity, 0)
    const orderSubtotal = items.reduce((sum, i) => sum + i.subtotal, 0)

    const token = localStorage.getItem('token')

    async function loadCart() {
        if (!token) { setLoading(false); return }
        setLoading(true)
        setError(null)
        try {
            const cart = await getCart(token)
            setItems(cart?.items ?? [])
            onCartUpdate(cart?.itemCount ?? 0)
        } catch (e) {
            setError(e.message || 'Failed to load cart.')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadCart() }, [])

    function addBusy(id) {
        setBusy(prev => new Set(prev).add(id))
    }
    function removeBusy(id) {
        setBusy(prev => { const s = new Set(prev); s.delete(id); return s })
    }

    async function handleQuantityChange(productId, newQty) {
        if (busy.has(productId)) return
        addBusy(productId)
        try {
            const cart = await updateCartItem(token, productId, newQty)
            setItems(cart?.items ?? [])
            onCartUpdate(cart?.itemCount ?? 0)
        } catch (e) {
            setError(e.message || 'Failed to update quantity.')
        } finally {
            removeBusy(productId)
        }
    }

    async function handleRemove(productId) {
        if (busy.has(productId)) return
        addBusy(productId)
        try {
            await removeCartItem(token, productId)
            const updated = items.filter(i => i.productId !== productId)
            setItems(updated)
            onCartUpdate(updated.reduce((sum, i) => sum + i.quantity, 0))
        } catch (e) {
            setError(e.message || 'Failed to remove item.')
        } finally {
            removeBusy(productId)
        }
    }

    async function handleClearCart() {
        try {
            await clearCart(token)
            setItems([])
            onCartUpdate(0)
        } catch (e) {
            setError(e.message || 'Failed to clear cart.')
        }
    }

    // ── No token ──
    if (!token) {
        return (
            <div className="cart-page">
                <h1 className="cart-page__title">Shopping Cart</h1>
                <div className="cart-auth">
                    <p className="cart-auth__msg">Please sign in to view your cart.</p>
                    <button className="cart-auth__btn" onClick={onNeedAuth}>Sign In</button>
                    <Link to="/" className="cart-auth__link">← Continue Shopping</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="cart-page">
            <h1 className="cart-page__title">Shopping Cart</h1>

            {/* ── Error banner ── */}
            {error && (
                <div className="cart-error">
                    <span>{error}</span>
                    <button className="cart-error__dismiss" onClick={() => setError(null)}>✕</button>
                </div>
            )}

            {/* ── Loading ── */}
            {loading && (
                <div className="cart-skeleton">
                    {[1, 2, 3].map(i => <SkeletonRow key={i} />)}
                </div>
            )}

            {/* ── Empty ── */}
            {!loading && items.length === 0 && (
                <div className="cart-empty">
                    <div className="cart-empty__icon">🛒</div>
                    <p className="cart-empty__msg">Your cart is empty.</p>
                    <Link to="/" className="cart-empty__link">Continue Shopping →</Link>
                </div>
            )}

            {/* ── Items + Summary ── */}
            {!loading && items.length > 0 && (
                <div className="cart-layout">

                    {/* Left: items list */}
                    <section className="cart-items">
                        <div className="cart-items__header">
                            <span className="cart-items__count">{totalItems} item{totalItems !== 1 ? 's' : ''}</span>
                            <button className="cart-items__clear" onClick={handleClearCart}>
                                Clear cart
                            </button>
                        </div>

                        {items.map(item => {
                            const color   = getColor(item.productId)
                            const isBusy  = busy.has(item.productId)

                            return (
                                <div className={`cart-row${isBusy ? ' cart-row--busy' : ''}`} key={item.productId}>

                                    {/* Placeholder image */}
                                    <div className="cart-row__img" style={{ background: color.bg }}>
                                          <span className="cart-row__initial" style={{ color: color.text }}>
                                              {item.productName.charAt(0).toUpperCase()}
                                          </span>
                                    </div>

                                    {/* Name + unit price */}
                                    <div className="cart-row__info">
                                        <p className="cart-row__name">{item.productName}</p>
                                        <p className="cart-row__unit">${Number(item.price).toFixed(2)} each</p>
                                    </div>

                                    {/* Quantity stepper */}
                                    <div className="cart-row__qty">
                                        <button
                                            className="cart-row__qty-btn"
                                            onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
                                            disabled={item.quantity <= 1 || isBusy}
                                            aria-label="Decrease quantity"
                                        >−</button>
                                        <span className="cart-row__qty-val">{item.quantity}</span>
                                        <button
                                            className="cart-row__qty-btn"
                                            onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                                            disabled={isBusy}
                                            aria-label="Increase quantity"
                                        >+</button>
                                    </div>

                                    {/* Line subtotal */}
                                    <div className="cart-row__subtotal">
                                        ${Number(item.subtotal).toFixed(2)}
                                    </div>

                                    {/* Remove */}
                                    <button
                                        className="cart-row__remove"
                                        onClick={() => handleRemove(item.productId)}
                                        disabled={isBusy}
                                        aria-label={`Remove ${item.productName}`}
                                    >✕</button>
                                </div>
                            )
                        })}
                    </section>

                    {/* Right: order summary */}
                    <aside className="cart-summary">
                        <h2 className="cart-summary__title">Order Summary</h2>
                        <div className="cart-summary__row">
                            <span>Items ({totalItems})</span>
                            <span>${orderSubtotal.toFixed(2)}</span>
                        </div>
                        <div className="cart-summary__row">
                            <span>Shipping</span>
                            <span className="cart-summary__free">FREE</span>
                        </div>
                        <div className="cart-summary__divider" />
                        <div className="cart-summary__row cart-summary__row--total">
                            <span>Order Total</span>
                            <span>${orderSubtotal.toFixed(2)}</span>
                        </div>
                        <button className="cart-summary__checkout" disabled>
                            Proceed to Checkout
                        </button>
                        <Link to="/" className="cart-summary__continue">
                            ← Continue Shopping
                        </Link>
                    </aside>
                </div>
            )}
        </div>
    )
}
