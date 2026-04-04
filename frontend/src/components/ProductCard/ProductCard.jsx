import { useState } from 'react';
import './ProductCard.css';

const COLORS = [
    { bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', text: '#1d4ed8' },
    { bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', text: '#15803d' },
    { bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', text: '#b45309' },
    { bg: 'linear-gradient(135deg,#fce7f3,#fbcfe8)', text: '#be185d' },
    { bg: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', text: '#6d28d9' },
    { bg: 'linear-gradient(135deg,#e0f2fe,#bae6fd)', text: '#0369a1' },
    { bg: 'linear-gradient(135deg,#fff7ed,#fed7aa)', text: '#c2410c' },
    { bg: 'linear-gradient(135deg,#f0fdf4,#bbf7d0)', text: '#166534' },
];
const RATINGS       = [4.5, 4.3, 4.7, 4.1, 4.6, 4.8, 3.9, 4.2, 4.4, 4.0];
const REVIEW_COUNTS = [1284, 532, 89, 2107, 445, 127, 678, 312, 891, 56];

const getColor       = id => COLORS[(id - 1) % COLORS.length];
const getRating      = id => RATINGS[(id - 1) % RATINGS.length];
const getReviewCount = id => REVIEW_COUNTS[(id - 1) % REVIEW_COUNTS.length];

function Stars({ rating }) {
    const filled = Math.round(rating);
    return (
        <span className="pc-stars" aria-label={`${rating} out of 5 stars`}>
              {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className={`pc-star ${i <= filled ? 'pc-star--full' : 'pc-star--empty'}`}>
                      {i <= filled ? '★' : '☆'}
                  </span>
              ))}
          </span>
    );
}

function stockInfo(stock) {
    if (stock <= 0) return { label: 'Out of Stock',        cls: 'pc-stock--out' };
    if (stock <= 5) return { label: `Only ${stock} left!`, cls: 'pc-stock--low' };
    return              { label: 'In Stock',               cls: 'pc-stock--ok'  };
}

export default function ProductCard({ product, isLoggedIn, onAdd, onNeedAuth }) {
    const [status, setStatus] = useState('idle');
    const [errMsg, setErrMsg] = useState('');

    const color      = getColor(product.id);
    const rating     = getRating(product.id);
    const reviews    = getReviewCount(product.id);
    const stock      = stockInfo(product.stock);
    const outOfStock = product.stock <= 0;

    async function handleAdd() {
        if (!isLoggedIn)                       { onNeedAuth(); return; }
        if (outOfStock || status === 'adding') return;

        setStatus('adding');
        setErrMsg('');
        try {
            await onAdd(product.id);
            setStatus('added');
            setTimeout(() => setStatus('idle'), 2000);
        } catch (e) {
            setErrMsg(e.message || 'Could not add to cart');
            setStatus('error');
            setTimeout(() => setStatus('idle'), 3000);
        }
    }

    function btnLabel() {
        if (!isLoggedIn)         return 'Sign in to buy';
        if (outOfStock)          return 'Out of Stock';
        if (status === 'adding') return 'Adding…';
        if (status === 'added')  return '✓ Added to Cart';
        return 'Add to Cart';
    }

    return (
        <article className={`pc-card${outOfStock ? ' pc-card--oos' : ''}`}>

            <div className="pc-card__image" style={{ background: color.bg }}>
                  <span className="pc-card__initial" style={{ color: color.text }}>
                      {product.name.charAt(0).toUpperCase()}
                  </span>
            </div>

            <div className="pc-card__body">
                <h3 className="pc-card__name" title={product.name}>
                    {product.name}
                </h3>

                <div className="pc-card__rating">
                    <Stars rating={rating} />
                    <span className="pc-card__review-count">
                          ({reviews.toLocaleString()})
                      </span>
                </div>

                <div className="pc-card__price">
                    ${Number(product.price).toFixed(2)}
                </div>

                <div className={`pc-card__stock ${stock.cls}`}>
                    {stock.label}
                </div>

                {errMsg && <div className="pc-card__err">{errMsg}</div>}

                <button
                    type="button"
                    className={`pc-card__btn${status === 'added' ? ' pc-card__btn--added' : ''}`}
                    disabled={outOfStock || status === 'adding'}
                    onClick={handleAdd}
                >
                    {btnLabel()}
                </button>
            </div>
        </article>
    );
}