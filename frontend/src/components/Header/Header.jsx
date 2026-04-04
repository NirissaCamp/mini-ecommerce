import { useState, useEffect, useRef } from "react"
import { useNavigate, Link } from 'react-router-dom'
import './Header.css'

export default function Header({ onOpenAuth, userName, onLogout, cartCount = 0 }) {
export default function Header({ onOpenAuth, userName, isAdmin, onLogout }) {
    const [accountMenuOpen, setAccountMenuOpen] = useState(false)
    const accountWrapRef = useRef(null)
    const accountBtnRef = useRef(null)
    const [menuPos, setMenuPos] = useState({top: 0, right: 0})
    const navigate = useNavigate()
    // 点击页面其它地方关闭菜单
    useEffect(() => {
        if (!accountMenuOpen || !accountBtnRef.current) return

        const rect = accountBtnRef.current.getBoundingClientRect()
        setMenuPos({
            top: rect.bottom + 8,
            right: window.innerWidth - rect.right,
            })

        }, [accountMenuOpen])

    useEffect(() => {
        if (!accountMenuOpen) return
        function handlePointerDown(e) {
            if (accountWrapRef.current && !accountWrapRef.current.contains(e.target)) {
                setAccountMenuOpen(false)
            }
        }

        document.addEventListener('pointerdown', handlePointerDown)
        return () => document.removeEventListener('pointerdown', handlePointerDown)
    }, [accountMenuOpen])

    return (
        <header className="site-header">
            <div className="site-header__inner">
                <div className="site-header__brand">
                    <Link className="site-header__logo" to={"/"}>MiniShop</Link>
                </div>
                <button type="button" className="site-header__deliver" aria-label="选择配送地址">
                    <svg
                        className="site-header__deliver-icon"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        aria-hidden
                    >
                        <path
                            fill="currentColor"
                            d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"
                        />
                    </svg>
                    <span className="site-header__deliver-text">
                        <span className="site-header__deliver-line1">
                          Delivering to Seattle
                        </span>
                        <span className="site-header__deliver-line2">Update location</span>
                    </span>
                </button>
                <div className="site-header__search">
                    <select className="site-header__search-all" aria-label="搜索分类">
                        <option value="all">All</option>
                        <option value="books">Books</option>
                        <option value="electronics">Electronics</option>
                        <option value="home">Home</option>
                    </select>

                    <input
                        type="search"
                        className="site-header__search-input"
                        placeholder="Search MiniShop"
                        autoComplete="off"
                    />

                    <button type="button" className="site-header__search-btn" aria-label="搜索">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                        >
                            <path
                                d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35"
                                stroke="#111"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </button>
                </div>

                <div  className="site-header__account-wrap" ref={accountWrapRef}>
                    <button type="button" className="site-header__account" ref={accountBtnRef} onClick={() => {
                        if (userName) {
                            setAccountMenuOpen((open) => !open)
                        } else {
                            onOpenAuth?.()
                        }
                    }}
                    >
                        <span className="site-header__account-icon" aria-hidden>👤</span>
                        <span className="site-header__account-text">
                            <span className="site-header__account-line1">
                              {userName ? `Hello, ${userName}` : 'Hello, sign in'}
                            </span>
                            <span className="site-header__account-line2">Account & Lists</span>
                        </span>
                    </button>
                    {userName && accountMenuOpen && (
                        <div className="site-header__account-menu" role="menu" style={{
                            position: 'fixed',
                            top: menuPos.top,
                            right: menuPos.right,
                            zIndex: 4000,
                        }}>
                            <div className="site-header__account-menu-user">
                                <div className="site-header__account-menu-name">{userName}</div>
                                <div className="site-header__account-menu-email">
                                    {/* 后端没有邮箱时可写死占位或删掉这一行 */}
                                    {userName}@minishop.local
                                </div>
                            </div>

                            <button
                                type="button"
                                className="site-header__account-menu-profile"
                                onClick={() => {
                                    navigate('/profile')
                                    setAccountMenuOpen(false)
                                }}
                            >
                                My Profile
                            </button>
                            {isAdmin && (
                                <button
                                    type="button"
                                    className="site-header__account-menu-profile"
                                    onClick={() => {
                                        navigate('/admin/products')
                                        setAccountMenuOpen(false)
                                    }}
                                >
                                    Admin · Products
                                </button>
                            )}

                            <div className="site-header__account-menu-divider" />

                            <button
                                type="button"
                                className="site-header__account-menu-logout"
                                onClick={() => {
                                    onLogout?.()
                                    setAccountMenuOpen(false)
                                }}
                            >
                                <span className="site-header__account-menu-logout-icon" aria-hidden>
                                  ⎋
                                </span>
                                Log Out
                            </button>
                        </div>
                    )}
                </div>

                <button type="button" className="site-header__returns" aria-label="退货与订单">
                    <span className="site-header__returns-line1">Returns</span>
                    <span className="site-header__returns-line2">& Orders</span>
                </button>

                <button type="button" className="site-header__cart" onClick={()=>navigate('/cart')} aria-label="购物车">
                      <span className="site-header__cart-wrap">
                        <svg
                            className="site-header__cart-icon"
                            viewBox="0 0 24 24"
                            width="40"
                            height="28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            aria-hidden
                        >
                          {/* 车身 + 把手：一笔轮廓，更像常见电商购物车 */}
                            <path
                                d="M1 2h2l2.68 13.26a2 2 0 002 1.74h9.24A2 2 0 0021 15.54l2.06-9.54H5.42"
                                stroke="currentColor"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                            {/* 轮子 */}
                            <circle cx="9" cy="20" r="1.6" fill="currentColor" />
                          <circle cx="18" cy="20" r="1.6" fill="currentColor" />
                        </svg>
                        <span className="site-header__cart-count">{cartCount}</span>
                      </span>
                    <span className="site-header__cart-label">Cart</span>
                </button>
            </div>
        </header>
    )
}