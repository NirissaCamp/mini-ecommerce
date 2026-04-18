import { NavLink, useNavigate } from 'react-router-dom'
import './AdminLayout.css'


const NAV_ITEMS = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: '🗂️' },
    { label: 'Products',   path: '/admin/products',   icon: '🛍️', needs: p => p.some(c => c.startsWith('PRODUCT_')) },
    { label: 'Inventory',  path: '/admin/inventory',  icon: '📦', needs: p => p.some(c => c.startsWith('INVENTORY_')) },
    { label: 'Orders',     path: '/admin/orders',     icon: '🧾', needs: p => p.some(c => c.startsWith('ORDER_')) },
    { label: 'Users',     path: '/admin/users',     icon: '👥', needs: p => p.some(c => c.startsWith('USER_')) },
]

export default function AdminLayout({ children, userName, userRole, userPermissions = [], isSuperAdmin = false, onLogout }) {
    const displayRole = userRole ? userRole.replace(/^ROLE_/, '') : 'Admin'
    const navigate = useNavigate()
    const visibleNav = NAV_ITEMS.filter(item => !item.needs || isSuperAdmin || item.needs(userPermissions))

    return (
        <div className="al-shell">

            {/* Sidebar */}
            <aside className="al-sidebar">
                <div className="al-logo">
                    <span className="al-logo__icon">⊟</span>
                    <span className="al-logo__text">Management</span>
                </div>

                <nav className="al-nav">
                    {visibleNav.map(item => (
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
                    <div className="al-topbar__right">
                        <button className='al-user-btn'>
                            <span className='al-user-btn__icon'>👤</span>
                            <div className="al-user-btn__text">
                                <span className="al-topbar__username">{userName ?? 'Admin'}</span>
                                <span className="al-topbar__role">{displayRole}</span>
                            </div>
                        </button>

                        <div className="al-user-dropdown">
                            <button className="al-user-dropdown__item" onClick={()=>onLogout()}>
                                Logout
                            </button>
                        </div>

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
