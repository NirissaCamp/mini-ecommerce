import { useState, useEffect, useMemo } from 'react';
import ProductCard from '../ProductCard/ProductCard';
import { getProducts } from '../../api/products';
import { addToCart } from '../../api/cart';
import './ProductCatalog.css';

const SORT_OPTIONS = [
    { value: 'featured',   label: 'Featured'           },
    { value: 'price-asc',  label: 'Price: Low to High' },
    { value: 'price-desc', label: 'Price: High to Low' },
    { value: 'name-asc',   label: 'Name: A–Z'          },
];

function SkeletonCard() {
    return (
        <div className="pcat-skeleton">
            <div className="pcat-skeleton__img pcat-shimmer" />
            <div className="pcat-skeleton__body">
                <div className="pcat-skeleton__line pcat-shimmer" style={{ width: '80%' }} />
                <div className="pcat-skeleton__line pcat-shimmer" style={{ width: '55%' }} />
                <div className="pcat-skeleton__line pcat-shimmer" style={{ width: '40%', height: 22 }} />
                <div className="pcat-skeleton__btn  pcat-shimmer" />
            </div>
        </div>
    );
}

export default function ProductCatalog({ userName, onNeedAuth, onCartUpdate }) {
    const [products, setProducts] = useState([]);
    const [loading,  setLoading]  = useState(true);
    const [error,    setError]    = useState('');
    const [sort,     setSort]     = useState('featured');
    const [search,   setSearch]   = useState('');
    const [toast,    setToast]    = useState('');

    function showToast(msg) {
        setToast(msg);
        setTimeout(() => setToast(''), 3000);
    }

    // Fetch products once on mount
    useEffect(() => {
        setLoading(true);
        setError('');
        getProducts()
            .then(setProducts)
            .catch(e => setError(e.message || 'Failed to load products.'))
            .finally(() => setLoading(false));
    }, []);

    // Client-side filter + sort — no extra network calls
    const displayed = useMemo(() => {
        let list = [...products];

        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(p =>
                p.name.toLowerCase().includes(q) ||
                (p.description || '').toLowerCase().includes(q)
            );
        }

        switch (sort) {
            case 'price-asc':  list.sort((a, b) => a.price - b.price);            break;
            case 'price-desc': list.sort((a, b) => b.price - a.price);            break;
            case 'name-asc':   list.sort((a, b) => a.name.localeCompare(b.name)); break;
            default:           list.sort((a, b) => a.id - b.id);                  break;
        }
        return list;
    }, [products, sort, search]);

    // Called by each ProductCard — returns the updated cart so card can read state
    async function handleAdd(productId) {
        const token = localStorage.getItem('token');
        const cart  = await addToCart(token, productId, 1);
        onCartUpdate(cart.itemCount);
        showToast('Item added to cart!');
        return cart;
    }

    return (
        <div className="pcat">

            {/* ── Hero banner ── */}
            <div className="pcat-banner">
                <div className="pcat-banner__inner">
                    <h1 className="pcat-banner__title">Today's Deals</h1>
                    <p  className="pcat-banner__sub">Fresh picks, unbeatable prices</p>
                </div>
            </div>

            {/* ── Filter / sort bar ── */}
            <div className="pcat-controls">
                  <span className="pcat-controls__count">
                      {!loading && !error &&
                          `${displayed.length} result${displayed.length !== 1 ? 's' : ''}`}
                  </span>
                <div className="pcat-controls__right">
                    <input
                        className="pcat-search"
                        type="search"
                        placeholder="Filter products…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select
                        className="pcat-sort"
                        value={sort}
                        onChange={e => setSort(e.target.value)}
                    >
                        {SORT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Product grid ── */}
            <div className="pcat-grid-wrap">

                {loading && (
                    <div className="pcat-grid">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <div className="pcat-state">
                        <p className="pcat-state__msg">{error}</p>
                        <button
                            className="pcat-state__btn"
                            onClick={() => window.location.reload()}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && displayed.length === 0 && (
                    <div className="pcat-state">
                        <p className="pcat-state__msg">
                            No products found{search ? ` for "${search}"` : ''}.
                        </p>
                    </div>
                )}

                {!loading && !error && displayed.length > 0 && (
                    <div className="pcat-grid">
                        {displayed.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                isLoggedIn={!!userName}
                                onAdd={handleAdd}
                                onNeedAuth={onNeedAuth}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Toast ── */}
            {toast && (
                <div className="pcat-toast" role="status">
                    <span className="pcat-toast__icon">✓</span> {toast}
                </div>
            )}
        </div>
    );
}
