 import { useEffect, useState, useMemo } from 'react'
  import { adminListProducts } from '../../api/adminProducts'
  import './AdminDashboard.css'

  export default function AdminDashboard() {
      const [productCount, setProductCount] = useState('-')
      const [loading, setLoading] = useState(true)
      const token = useMemo(() => localStorage.getItem('token'), [])

      useEffect(() => {
          if (!token) return
          adminListProducts(token)
              .then(data => setProductCount(Array.isArray(data) ? data.length : 0))
              .catch(() => setProductCount('?'))
              .finally(() => setLoading(false))
      }, [token])

      const cards = [
          { label: 'Products', value: loading ? '...' : productCount, icon: '🛍️', color: '#5c6bc0' },
          { label: 'Users',    value: 'N/A', icon: '👥', color: '#26a69a' },
          { label: 'Orders',   value: 'N/A', icon: '🧾', color: '#ef6c00' },
      ]

      return (
          <div>
              <h1 className="ad-title">Dashboard</h1>

              <div className="ad-cards">
                  {cards.map(card => (
                      <div key={card.label} className="ad-card">
                          <div className="ad-card__icon" style={{ color: card.color }}>
                              {card.icon}
                          </div>
                          <div className="ad-card__info">
                              <div className="ad-card__value">{card.value}</div>
                              <div className="ad-card__label">{card.label}</div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )
  }
