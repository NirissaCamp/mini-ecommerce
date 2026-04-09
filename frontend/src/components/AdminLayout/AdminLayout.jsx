import { NavLink, useNavigate } from 'react-router-dom'
import './AdminLayout.css'

const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '🗂️' },
    { label: 'Products',  path: '/admin/products',  icon: '🛍️' },
    { label: 'Orders',    path: '/admin/orders',    icon: '🧾' },
    { label: 'Users',     path: '/admin/users',     icon: '👥' },
]

export default function AdminLayout({ children, userName }) {
    const navigate = useNavigate()

    return (
        <div className="al-shell">

            {/* Sidebar */}
            <aside className="al-sidebar">
                <div className="al-logo">
                    <span className="al-logo__icon">⊟</span>
                    <span className="al-logo__text">Management</span>
                </div>

                <nav className="al-nav">
                    {NAV_ITEMS.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                `al-nav__item${isActive ? ' al-nav__item--active' : ''}`
                            }
                        >
                            <span className="al-nav__icon">{item.icon}</span>
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div className="al-sidebar__bottom">
                    <button className="al-nav__item" onClick={() => navigate('/')}>
                        <span className="al-nav__icon">←</span>
                        Back to Shop
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div className="al-main">

                {/* Top bar */}
                <header className="al-topbar">
                    <div className="al-topbar__search">
                        <span>🔍</span>
                        <input placeholder="Search anything..." />
                    </div>
                    <div className="al-topbar__right">
                        <span className="al-topbar__username">{userName ?? 'Admin'}</span>
                        <span className="al-topbar__role">Superadmin</span>
                    </div>
                </header>

                {/* Page content */}
                <main className="al-content">
                    {children}
                </main>

            </div>
        </div>
    )
}
